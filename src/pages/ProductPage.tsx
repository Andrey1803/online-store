import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { formatPrice } from '../lib/catalog';
import { COMPANY } from '../data/company';
import { ORGANIZATION_JSON_LD, productJsonLd } from '../data/seo';
import { absoluteUrl, truncate } from '../lib/seo';
import { recordProductView } from '../lib/productActivity';
import { getProductSpecs } from '../lib/productSpecs';
import { useStore } from '../context/StoreContext';
import { AddToCartControls } from '../components/AddToCartControls';
import { ProductImage } from '../components/ProductImage';
import './ProductPage.css';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getProductBySlug, getCategoryById } = useStore();
  const product = slug ? getProductBySlug(slug) : undefined;

  useEffect(() => {
    if (product) recordProductView(product.id);
  }, [product?.id]);

  if (!product) {
    return (
      <div className="empty-state">
        <PageMeta title="Товар не найден" description="Товар не найден в каталоге" path="/catalog" noindex />
        <h1>Товар не найден</h1>
        <Link to="/catalog" className="btn btn-primary">
          В каталог
        </Link>
      </div>
    );
  }

  const category = getCategoryById(product.categoryId);
  const categoryLink = category?.parentId
    ? `/catalog/${category.parentId}`
    : category
      ? `/catalog/${category.slug}`
      : '/catalog';

  const productSpecs = getProductSpecs(product);

  const handleAddedToCart = () => {
    const idx = window.history.state?.idx as number | undefined;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(categoryLink);
    }
  };

  const productImage = product.image ? absoluteUrl(product.image) : undefined;

  return (
    <div className="product-page">
      <PageMeta
        title={product.name}
        description={truncate(
          `${product.brand} ${product.name}. ${product.description ?? ''} Цена ${formatPrice(product.price, true)}. Купить в Минске.`,
        )}
        path={`/product/${product.slug}`}
        image={productImage}
        jsonLd={[ORGANIZATION_JSON_LD, productJsonLd(product)]}
      />
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/catalog">Каталог</Link>
        {category && (
          <>
            <span>/</span>
            <Link to={categoryLink}>{category.name}</Link>
          </>
        )}
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="product-detail-image-wrap">
          <ProductImage product={product} size="detail" />
        </div>
        <div className="product-detail-info">
          <span className="product-brand">{product.brand}</span>
          <h1>{product.name}</h1>
          <div className="product-detail-prices">
            <span className="price-current">{formatPrice(product.price, true)}</span>
            {product.oldPrice && (
              <span className="price-old">{formatPrice(product.oldPrice, true)}</span>
            )}
          </div>
          {COMPANY.vatPayer && (
            <p className="price-vat-hint">Цена включает НДС {COMPANY.vatRate}%</p>
          )}
          <p className={`stock ${product.inStock ? 'in' : 'out'}`}>
            {product.inStock ? '✓ В наличии' : 'Под заказ — уточняйте срок'}
          </p>
          <p className="product-description">{product.description}</p>
          <AddToCartControls
            product={product}
            variant="detail"
            onAdded={handleAddedToCart}
          />
        </div>
      </div>

      {productSpecs.length > 0 && (
        <section className="specs-section">
          <h2>Характеристики</h2>
          <table className="specs-table">
            <tbody>
              {productSpecs.map((s) => (
                <tr key={s.label}>
                  <th>{s.label}</th>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
