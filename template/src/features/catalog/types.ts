export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  /** Integer amount in cents (see `utils/money.ts`). */
  price: number;
  /** Original price when the product is on sale. */
  compareAtPrice: number | null;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
}

/** What product cards need; favorites keep this snapshot on the device. */
export type ProductSummary = Pick<
  Product,
  | 'id'
  | 'name'
  | 'price'
  | 'compareAtPrice'
  | 'images'
  | 'rating'
  | 'reviewCount'
  | 'stock'
>;

export type ProductSort =
  'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface ProductFilters {
  search: string;
  /** Category id, or `all`. */
  category: string;
  sort: ProductSort;
  onSale: boolean;
}

export interface ProductPage {
  data: Product[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function toProductSummary(product: ProductSummary): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: product.images,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
  };
}
