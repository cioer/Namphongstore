export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  children?: Category[];
  parent?: Category;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  price_sale: string | number;
  price_original: string | number;
  discount_percent: number;
  promo_start?: string | Date | null;
  promo_end?: string | Date | null;
  images?: any;
  gifts?: any;
  averageRating?: number;
  totalReviews?: number;
}

export interface Product extends ProductSummary {
  category_id: string;
  brand?: string | null;
  description?: string | null;
  specs?: any;
  warranty_months: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  category?: Category;
}
