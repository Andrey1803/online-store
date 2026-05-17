import { Link } from 'react-router-dom';
import type { Product } from '../data/products';
import { formatPrice } from '../lib/catalog';
import { getProductCardBrief } from '../lib/productDisplay';
import { getProductCardSpecs } from '../lib/productSpecs';
import { AddToCartControls } from './AddToCartControls';
import { ProductImage } from './ProductImage';
import './ProductCard.css';

export function ProductCard({
  product,
  variant = 'default',
}: {
  product: Product;
  variant?: 'default' | 'compact';
}) {
  const isCompact = variant === 'compact';
  const cardSpecs = isCompact ? [] : getProductCardSpecs(product);
  const brief = isCompact ? getProductCardBrief(product) : null;

  return (
    <article className={`product-card${isCompact ? ' product-card--compact' : ''}`}>
      <Link to={`/product/${product.slug}`} className="product-card-image">
        <ProductImage product={product} size="card" />
      </Link>
      <div className="product-card-body">
        {isCompact && brief ? (
          <>
            {brief.brand && <span className="product-brand">{brief.brand}</span>}
            <Link
              to={`/product/${product.slug}`}
              className="product-name"
              title={product.name}
            >
              {brief.title}
            </Link>
          </>
        ) : (
          <>
            <span className="product-brand">{product.brand}</span>
            <Link to={`/product/${product.slug}`} className="product-name">
              {product.name}
            </Link>
          </>
        )}
        <div className="product-prices">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className="price-old">{formatPrice(product.oldPrice)}</span>
          )}
        </div>
        {cardSpecs.length > 0 && (
          <ul className="product-card-specs">
            {cardSpecs.map((s) => (
              <li key={s.label}>
                <span className="product-card-spec-label">{s.label}</span>
                <span className="product-card-spec-value">{s.value}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="product-card-actions">
          {!isCompact && (
            <Link to={`/product/${product.slug}`} className="btn btn-outline">
              Подробнее
            </Link>
          )}
          <AddToCartControls product={product} variant={isCompact ? 'compact' : 'card'} />
        </div>
      </div>
    </article>
  );
}
