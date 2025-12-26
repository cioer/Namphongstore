// Vietnamese currency formatter
export function formatVND(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Check if promo is active
export function isPromoActive(promoStart?: Date | string | null, promoEnd?: Date | string | null): boolean {
  if (!promoStart || !promoEnd) return false;
  const now = new Date();
  const start = new Date(promoStart);
  const end = new Date(promoEnd);
  return now >= start && now <= end;
}

// Generate warranty code
export function generateWarrantyCode(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `NP-WTY-${yy}${mm}-${random}`;
}

// Get first image from images JSON array
export function getFirstImage(images: any): string {
  if (!images) return '/placeholder.png';
  if (Array.isArray(images) && images.length > 0) return images[0];
  return '/placeholder.png';
}

// Handle image error with fallback
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.src = 'https://via.placeholder.com/400x400.png?text=No+Image';
}

