import { findSession } from '../db';
import type { MockRequest, MockResponse, MockRoute } from '../handlers';
import {
  CATEGORIES,
  MOCK_DECLINED_CARD_LAST4,
  type MockAddress,
  type MockOrder,
  type MockOrderItem,
  type MockPayment,
  type MockProduct,
  nextOrderNumber,
  SHIPPING_OPTIONS,
  shippingCostFor,
  shoppingDb,
} from './data';

const SORTS = ['featured', 'price_asc', 'price_desc', 'rating', 'newest'];

const unauthorized: MockResponse = {
  status: 401,
  data: { message: 'Unauthorized' },
};
const notFound = (what: string): MockResponse => ({
  status: 404,
  data: { message: `${what} not found` },
});
const invalid = (message: string): MockResponse => ({
  status: 422,
  data: { message },
});

/** Wraps a handler so it only runs for signed-in users. */
function authed(
  handler: (request: MockRequest) => MockResponse,
): (request: MockRequest) => MockResponse {
  return request => {
    const token = request.authorization?.replace(/^Bearer\s+/i, '');
    return token && findSession(token) ? handler(request) : unauthorized;
  };
}

function field(body: unknown, name: string): unknown {
  return typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)[name]
    : undefined;
}

function text(body: unknown, name: string): string {
  const value = field(body, name);
  return typeof value === 'string' ? value.trim() : '';
}

// -------------------------------------------------------------- products

function serializeProduct(product: MockProduct) {
  const { categoryId, ...rest } = product;
  const category = CATEGORIES.find(({ id }) => id === categoryId) ?? {
    id: categoryId,
    name: categoryId,
  };
  return { ...rest, category };
}

function compareProducts(sort: string) {
  return (a: MockProduct, b: MockProduct) => {
    switch (sort) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return 0; // featured: catalog order
    }
  };
}

// ---------------------------------------------------------------- orders

function readAddress(body: unknown): MockAddress | null {
  const address = {
    fullName: text(body, 'fullName'),
    street: text(body, 'street'),
    complement: text(body, 'complement'),
    city: text(body, 'city'),
    state: text(body, 'state'),
    postalCode: text(body, 'postalCode'),
  };
  const { fullName, street, city, state, postalCode } = address;
  return [fullName, street, city, state, postalCode].every(Boolean)
    ? address
    : null;
}

function readPayment(body: unknown): MockPayment | null {
  const method = field(body, 'method');
  if (method === 'cash') {
    return { method };
  }
  const last4 = text(body, 'last4');
  return method === 'card' && /^\d{4}$/.test(last4) ? { method, last4 } : null;
}

type ItemsResult =
  { items: MockOrderItem[]; products: MockProduct[] } | { error: MockResponse };

/** Validates the requested items against the catalog and the stock. */
function readItems(body: unknown): ItemsResult {
  const requested = Array.isArray(body) ? body : [];
  if (requested.length === 0) {
    return { error: invalid('The order has no items') };
  }
  const items: MockOrderItem[] = [];
  const products: MockProduct[] = [];
  for (const entry of requested) {
    const quantity = Number(field(entry, 'quantity'));
    const product = shoppingDb.products.find(
      ({ id }) => id === field(entry, 'productId'),
    );
    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      return { error: invalid('Invalid order item') };
    }
    if (quantity > product.stock) {
      return {
        error: {
          status: 409,
          data: {
            message: `Only ${product.stock} units of ${product.name} left`,
            details: { productId: product.id, stock: product.stock },
          },
        },
      };
    }
    products.push(product);
    items.push({
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? null,
      price: product.price,
      quantity,
    });
  }
  return { items, products };
}

// ---------------------------------------------------------------- routes

export const shoppingMockRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/categories',
    handler: authed(() => ({ status: 200, data: CATEGORIES })),
  },
  {
    method: 'GET',
    path: '/products',
    handler: authed(({ query }) => {
      const search = String(query.search ?? '')
        .trim()
        .toLowerCase();
      const category = typeof query.category === 'string' ? query.category : '';
      const sort = SORTS.includes(String(query.sort)) ? String(query.sort) : '';
      const onSale = query.onSale === 'true' || query.onSale === true;
      const page = Math.max(1, Number(query.page ?? 1) || 1);
      const limit = Math.max(1, Number(query.limit ?? 12) || 12);
      const filtered = shoppingDb.products
        .filter(
          product =>
            !search ||
            product.name.toLowerCase().includes(search) ||
            product.description.toLowerCase().includes(search),
        )
        .filter(product => !category || product.categoryId === category)
        .filter(product => !onSale || product.compareAtPrice !== null)
        .sort(compareProducts(sort));
      const start = (page - 1) * limit;
      return {
        status: 200,
        data: {
          data: filtered.slice(start, start + limit).map(serializeProduct),
          page,
          limit,
          total: filtered.length,
          hasMore: start + limit < filtered.length,
        },
      };
    }),
  },
  {
    method: 'GET',
    path: '/products/:id',
    handler: authed(({ params }) => {
      const product = shoppingDb.products.find(({ id }) => id === params.id);
      return product
        ? { status: 200, data: serializeProduct(product) }
        : notFound('Product');
    }),
  },
  {
    method: 'GET',
    path: '/shipping-options',
    handler: authed(() => ({ status: 200, data: SHIPPING_OPTIONS })),
  },
  {
    method: 'GET',
    path: '/orders',
    handler: authed(() => ({
      status: 200,
      data: [...shoppingDb.orders].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    })),
  },
  {
    method: 'GET',
    path: '/orders/:id',
    handler: authed(({ params }) => {
      const order = shoppingDb.orders.find(({ id }) => id === params.id);
      return order ? { status: 200, data: order } : notFound('Order');
    }),
  },
  {
    method: 'POST',
    path: '/orders',
    handler: authed(({ body }) => {
      const address = readAddress(field(body, 'address'));
      const payment = readPayment(field(body, 'payment'));
      const shippingMethod = field(body, 'shippingMethod');
      const option = SHIPPING_OPTIONS.find(({ id }) => id === shippingMethod);
      if (!address || !payment || !option) {
        return invalid('Invalid order');
      }
      const result = readItems(field(body, 'items'));
      if ('error' in result) {
        return result.error;
      }
      if (
        payment.method === 'card' &&
        payment.last4 === MOCK_DECLINED_CARD_LAST4
      ) {
        return { status: 402, data: { message: 'Card declined' } };
      }

      const subtotal = result.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const shippingCost = shippingCostFor(option.id, subtotal);
      const order: MockOrder = {
        ...nextOrderNumber(),
        createdAt: new Date().toISOString(),
        status: 'processing',
        items: result.items,
        subtotal,
        shippingCost,
        total: subtotal + shippingCost,
        shippingMethod: option.id,
        address,
        payment,
      };
      result.items.forEach((item, index) => {
        (result.products[index] as MockProduct).stock -= item.quantity;
      });
      shoppingDb.orders.push(order);
      return { status: 201, data: order };
    }),
  },
];
