import { useState } from 'react';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import './AddToCartControls.css';

interface AddToCartControlsProps {
  product: Product;
  variant?: 'detail' | 'card' | 'compact';
  /** После добавления (например, шаг назад в каталог) */
  onAdded?: () => void;
}

function clampQty(n: number): number {
  return Math.min(9999, Math.max(1, Math.floor(n) || 1));
}

export function AddToCartControls({
  product,
  variant = 'detail',
  onAdded,
}: AddToCartControlsProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!product.inStock) return;
    addItem(product, quantity);
    onAdded?.();
  };

  const isDetail = variant === 'detail';

  if (variant === 'compact') {
    return (
      <div className="add-to-cart add-to-cart--compact">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!product.inStock}
          onClick={handleAdd}
        >
          {product.inStock ? 'В корзину' : 'Нет в наличии'}
        </button>
      </div>
    );
  }

  return (
    <div className={`add-to-cart add-to-cart--${variant}`}>
      <div className="add-to-cart-qty">
        <span className="add-to-cart-qty-label">Количество</span>
        <div className="qty-controls" role="group" aria-label="Количество">
          <button
            type="button"
            className="qty-btn"
            disabled={!product.inStock || quantity <= 1}
            onClick={() => setQuantity((q) => clampQty(q - 1))}
            aria-label="Уменьшить"
          >
            −
          </button>
          <input
            type="number"
            className="qty-input"
            min={1}
            max={9999}
            value={quantity}
            disabled={!product.inStock}
            onChange={(e) => setQuantity(clampQty(Number(e.target.value)))}
            aria-label="Количество товара"
          />
          <button
            type="button"
            className="qty-btn"
            disabled={!product.inStock || quantity >= 9999}
            onClick={() => setQuantity((q) => clampQty(q + 1))}
            aria-label="Увеличить"
          >
            +
          </button>
        </div>
      </div>
      <button
        type="button"
        className={`btn btn-primary ${isDetail ? 'btn-lg' : ''}`}
        disabled={!product.inStock}
        onClick={handleAdd}
      >
        {product.inStock
          ? isDetail
            ? 'Добавить в корзину'
            : 'В корзину'
          : 'Нет в наличии'}
      </button>
    </div>
  );
}
