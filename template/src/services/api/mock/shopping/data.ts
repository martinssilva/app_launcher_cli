/** In-memory data of the shopping mock routes (catalog, shipping, orders). */
export interface MockCategory {
  id: string;
  name: string;
}

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  /** Prices are integers in cents. */
  price: number;
  compareAtPrice: number | null;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  createdAt: string;
}

export interface MockShippingOption {
  id: 'standard' | 'express';
  name: string;
  price: number;
  minDays: number;
  maxDays: number;
  /** Subtotal (cents) from which this option is free, or `null`. */
  freeOver: number | null;
}

export interface MockAddress {
  fullName: string;
  street: string;
  complement: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface MockOrderItem {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
}

export type MockOrderStatus =
  'processing' | 'shipped' | 'delivered' | 'cancelled';

export type MockPayment =
  { method: 'card'; last4: string } | { method: 'cash' };

export interface MockOrder {
  id: string;
  number: string;
  createdAt: string;
  status: MockOrderStatus;
  items: MockOrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: MockShippingOption['id'];
  address: MockAddress;
  payment: MockPayment;
}

/** Cards ending with these digits are declined with 402 (to try the error path). */
export const MOCK_DECLINED_CARD_LAST4 = '0002';

export const CATEGORIES: MockCategory[] = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'home', name: 'Home & Kitchen' },
  { id: 'sports', name: 'Sports' },
  { id: 'books', name: 'Books' },
  { id: 'beauty', name: 'Beauty' },
];

export const SHIPPING_OPTIONS: MockShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 599,
    minDays: 5,
    maxDays: 8,
    freeOver: 10_000,
  },
  {
    id: 'express',
    name: 'Express',
    price: 1499,
    minDays: 1,
    maxDays: 2,
    freeOver: null,
  },
];

/** [name, price in cents, compare-at price in cents or 0] per category. */
const CATALOG: Record<string, [string, number, number][]> = {
  electronics: [
    ['Wireless Headphones', 12_999, 15_999],
    ['Smart Watch', 19_900, 0],
    ['Bluetooth Speaker', 4_990, 0],
    ['USB-C Charger', 2_499, 2_999],
    ['Mechanical Keyboard', 8_900, 0],
    ['4K Action Camera', 24_900, 0],
  ],
  clothing: [
    ['Cotton T-Shirt', 1_990, 0],
    ['Denim Jacket', 7_990, 9_990],
    ['Running Shoes', 11_900, 0],
    ['Wool Beanie', 1_590, 0],
    ['Rain Jacket', 8_990, 0],
    ['Linen Shirt', 4_490, 5_490],
  ],
  home: [
    ['Ceramic Mug Set', 2_990, 0],
    ['French Press', 3_490, 0],
    ['Chef Knife', 6_900, 8_900],
    ['Linen Bed Sheets', 9_900, 0],
    ['Scented Candle', 1_890, 0],
    ['Cast Iron Skillet', 4_590, 0],
  ],
  sports: [
    ['Yoga Mat', 3_290, 0],
    ['Adjustable Dumbbells', 18_900, 21_900],
    ['Water Bottle', 1_990, 0],
    ['Resistance Bands', 2_490, 0],
    ['Cycling Helmet', 6_490, 0],
    ['Tennis Racket', 12_900, 0],
  ],
  books: [
    ['The Art of Cooking', 3_490, 0],
    ['Mindful Mornings', 1_890, 2_490],
    ['A Brief History of Design', 2_990, 0],
    ['Startup Playbook', 2_590, 0],
    ['Trail Guide', 2_190, 0],
    ['Poems for Rainy Days', 1_590, 0],
  ],
  beauty: [
    ['Hydrating Face Cream', 3_990, 0],
    ['Vitamin C Serum', 4_590, 5_490],
    ['Bamboo Hairbrush', 1_490, 0],
    ['Lip Balm Trio', 1_190, 0],
    ['Sunscreen SPF 50', 2_290, 0],
    ['Clay Face Mask', 2_690, 0],
  ],
};

const DAY = 86_400_000;

function imagesFor(id: string): string[] {
  // Placeholder photos; the app shows a fallback when there is no network.
  return [1, 2, 3].map(n => `https://picsum.photos/seed/${id}-${n}/600/600`);
}

/** Stock by product position: one sold-out and one low-stock item per category. */
function stockFor(position: number): number {
  if (position === 5) {
    return 0;
  }
  return position === 4 ? 2 : 10 + position * 5;
}

function seedProducts(): MockProduct[] {
  let count = 0;
  return CATEGORIES.flatMap(category =>
    (CATALOG[category.id] ?? []).map(([name, price, compareAt], position) => {
      count += 1;
      const id = `p${count}`;
      return {
        id,
        name,
        description: `${name} from our ${category.name.toLowerCase()} collection. Example product served by the mock API: replace it with your own catalog.`,
        categoryId: category.id,
        price,
        compareAtPrice: compareAt > 0 ? compareAt : null,
        images: imagesFor(id),
        rating: 3.5 + ((count * 7) % 16) / 10,
        reviewCount: 12 + ((count * 37) % 480),
        stock: stockFor(position),
        createdAt: new Date(Date.UTC(2026, 9, 1) + count * DAY).toISOString(),
      };
    }),
  );
}

const SAMPLE_ADDRESS: MockAddress = {
  fullName: 'Alex Morgan',
  street: '742 Evergreen Terrace',
  complement: '',
  city: 'Springfield',
  state: 'OR',
  postalCode: '97403',
};

function orderItem(product: MockProduct, quantity: number): MockOrderItem {
  return {
    productId: product.id,
    name: product.name,
    image: product.images[0] ?? null,
    price: product.price,
    quantity,
  };
}

function seedOrders(products: MockProduct[]): MockOrder[] {
  const find = (id: string) =>
    products.find(product => product.id === id) as MockProduct;
  const build = (
    id: string,
    number: string,
    daysAgo: number,
    status: MockOrderStatus,
    items: MockOrderItem[],
    shippingMethod: MockShippingOption['id'],
  ): MockOrder => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingCost = shippingCostFor(shippingMethod, subtotal);
    return {
      id,
      number,
      createdAt: new Date(Date.now() - daysAgo * DAY).toISOString(),
      status,
      items,
      subtotal,
      shippingCost,
      total: subtotal + shippingCost,
      shippingMethod,
      address: SAMPLE_ADDRESS,
      payment: { method: 'card', last4: '4242' },
    };
  };
  return [
    build(
      'o2',
      '10002',
      2,
      'shipped',
      [orderItem(find('p3'), 1), orderItem(find('p13'), 2)],
      'express',
    ),
    build(
      'o1',
      '10001',
      12,
      'delivered',
      [orderItem(find('p8'), 1)],
      'standard',
    ),
  ];
}

export function shippingCostFor(
  method: MockShippingOption['id'],
  subtotal: number,
): number {
  const option = SHIPPING_OPTIONS.find(({ id }) => id === method);
  if (!option) {
    return 0;
  }
  return option.freeOver !== null && subtotal >= option.freeOver
    ? 0
    : option.price;
}

function seed() {
  const products = seedProducts();
  return { products, orders: seedOrders(products) };
}

let orderCounter = 2;

export const shoppingDb = seed();

export function nextOrderNumber(): { id: string; number: string } {
  orderCounter += 1;
  return { id: `o${orderCounter}`, number: String(10_000 + orderCounter) };
}

export function resetShoppingData(): void {
  orderCounter = 2;
  Object.assign(shoppingDb, seed());
}
