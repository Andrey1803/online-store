import type { Product } from '../data/products';
import { useProductImageSrc } from '../hooks/useProductImageSrc';
import './ProductImage.css';

interface ProductImageProps {
  product: Product;
  className?: string;
  size?: 'card' | 'detail' | 'thumb';
}

export function ProductImage({ product, className = '', size = 'card' }: ProductImageProps) {
  const src = useProductImageSrc(product);

  if (src) {
    return (
      <img
        src={src}
        alt={product.name}
        className={`product-image product-image--${size} ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`product-image product-image--placeholder product-image--${size} ${className}`}
      style={{ background: product.imageColor }}
    >
      <span>⚙️</span>
    </div>
  );
}
