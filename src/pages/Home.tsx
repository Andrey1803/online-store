import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useProductActivity } from '../hooks/useProductActivity';
import { useStore } from '../context/StoreContext';
import type { Product } from '../data/products';
import './Home.css';

function ProductShowcaseSection({
  title,
  description,
  products,
  empty,
}: {
  title: string;
  description: string;
  products: Product[];
  empty?: ReactNode;
}) {
  if (products.length === 0) {
    return empty ? <section className="home-section">{empty}</section> : null;
  }

  return (
    <section className="home-section">
      <div className="home-section-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link to="/catalog" className="home-link-more">
          Весь каталог →
        </Link>
      </div>
      <div className="product-grid product-grid--showcase">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant="compact" />
        ))}
      </div>
    </section>
  );
}

export function Home() {
  const { site, mainCategories, products, getProductsByCategory, getSubcategories } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { recentlyViewed, topCart, hasTopCart } = useProductActivity(products, {
    viewedLimit: 5,
    topCartLimit: 5,
  });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
  };

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden />
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <p className="home-hero-badge">{site.tagline}</p>
            <h1>{site.heroTitle}</h1>
            <p className="home-hero-lead">{site.heroText}</p>

            <form className="home-search" onSubmit={handleSearch}>
              <input
                type="search"
                placeholder="Артикул, бренд, насос, бак…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Поиск по каталогу"
              />
              <button type="submit" className="btn btn-primary">
                Найти
              </button>
            </form>

            <div className="home-hero-actions">
              <Link to="/catalog" className="btn btn-primary btn-lg">
                Весь каталог
              </Link>
              <a href={site.phoneHref} className="btn btn-hero-outline btn-lg">
                {site.phone}
              </a>
            </div>
          </div>

          <div className="home-hero-stats">
            <div className="home-stat">
              <strong>{products.length.toLocaleString('ru-RU')}</strong>
              <span>товаров в каталоге</span>
            </div>
            <div className="home-stat">
              <strong>{mainCategories.length}</strong>
              <span>направлений</span>
            </div>
            <div className="home-stat">
              <strong>{site.city}</strong>
              <span>доставка и самовывоз</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <div>
            <h2>Каталог по направлениям</h2>
            <p>Насосы, баки, автоматика, фильтры и комплектующие — всё для водоснабжения</p>
          </div>
          <Link to="/catalog" className="home-link-more">
            Смотреть всё →
          </Link>
        </div>
        <div className="home-categories">
          {mainCategories.map((cat) => {
            const count = getProductsByCategory(cat.id).length;
            const subs = getSubcategories(cat.id);
            const subPreview = subs
              .slice(0, 3)
              .map((s) => s.name)
              .join(' · ');
            return (
              <Link key={cat.id} to={`/catalog/${cat.slug}`} className="home-cat-card">
                <span className="home-cat-icon">{cat.icon}</span>
                <div className="home-cat-body">
                  <strong>{cat.name}</strong>
                  <p>
                    {subs.length > 0
                      ? subPreview + (subs.length > 3 ? '…' : '')
                      : cat.description}
                  </p>
                  {count > 0 && (
                    <span className="home-cat-count">
                      {count} поз.
                      {subs.length > 0 && ` · ${subs.length} подкат.`}
                    </span>
                  )}
                </div>
                <span className="home-cat-arrow" aria-hidden>
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <ProductShowcaseSection
        title="Просматриваемые вами товары"
        description="Последние 5 товаров, которые вы открывали в каталоге"
        products={recentlyViewed}
        empty={
          <>
            <div className="home-section-head">
              <div>
                <h2>Просматриваемые вами товары</h2>
                <p>Последние 5 просмотренных — пока нет данных</p>
              </div>
            </div>
            <div className="home-empty">
              <p>Откройте карточки товаров в каталоге — они появятся здесь.</p>
              <Link to="/catalog" className="btn btn-primary">
                В каталог
              </Link>
            </div>
          </>
        }
      />

      <ProductShowcaseSection
        title="Топ продаж"
        description={
          hasTopCart
            ? 'Топ‑5 товаров, которые чаще всего добавляли в корзину'
            : 'Пока пусто — рейтинг появится после добавления товаров в корзину'
        }
        products={topCart}
        empty={
          <>
            <div className="home-section-head">
              <div>
                <h2>Топ продаж</h2>
                <p>
                  {products.length === 0
                    ? 'Каталог пока пуст'
                    : 'Топ‑5 по добавлениям в корзину — пока нет данных'}
                </p>
              </div>
            </div>
            <div className="home-empty">
              <p>
                {products.length === 0
                  ? 'Загрузите товары в админке или импортируйте Excel.'
                  : 'Откройте каталог и добавьте товары в корзину — здесь появятся самые популярные позиции.'}
              </p>
              <Link to="/catalog" className="btn btn-primary">
                {products.length === 0 ? 'Перейти в каталог' : 'В каталог'}
              </Link>
            </div>
          </>
        }
      />

      <section className="home-steps">
        <h2>Как заказать</h2>
        <ol className="home-steps-list">
          <li>
            <span className="home-step-num">1</span>
            <div>
              <strong>Выберите в каталоге</strong>
              <p>Фильтры по бренду, цене и категории помогут быстро найти нужное</p>
            </div>
          </li>
          <li>
            <span className="home-step-num">2</span>
            <div>
              <strong>Добавьте в корзину</strong>
              <p>Соберите заказ из нескольких позиций</p>
            </div>
          </li>
          <li>
            <span className="home-step-num">3</span>
            <div>
              <strong>Оформите заявку</strong>
              <p>Позвоните или напишите — уточним наличие и сроки</p>
            </div>
          </li>
          <li>
            <span className="home-step-num">4</span>
            <div>
              <strong>Получите заказ</strong>
              <p>Доставка по {site.city} или самовывоз</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="home-benefits">
        <article className="home-benefit">
          <span className="home-benefit-icon">🚚</span>
          <h3>Доставка</h3>
          <p>По {site.city} — согласуем удобное время и адрес</p>
        </article>
        <article className="home-benefit">
          <span className="home-benefit-icon">🔧</span>
          <h3>Подбор оборудования</h3>
          <p>Поможем подобрать насос под глубину скважины и расход воды</p>
        </article>
        <article className="home-benefit">
          <span className="home-benefit-icon">📋</span>
          <h3>Актуальный прайс</h3>
          <p>Большой каталог с ценами РРЦ и фото из прайс-листа поставщика</p>
        </article>
        <article className="home-benefit">
          <span className="home-benefit-icon">✅</span>
          <h3>Гарантия</h3>
          <p>Официальная гарантия производителя на оборудование</p>
        </article>
      </section>

      <section className="home-cta">
        <div className="home-cta-inner">
          <div>
            <h2>Нужна консультация?</h2>
            <p>Подберём насос, станцию или комплектующие под вашу задачу</p>
          </div>
          <div className="home-cta-actions">
            <a href={site.phoneHref} className="btn btn-primary btn-lg">
              Позвонить
            </a>
            <Link to="/contacts" className="btn btn-outline btn-lg">
              Контакты
            </Link>
          </div>
        </div>
        <p className="home-cta-note">{site.markupNote}</p>
      </section>
    </div>
  );
}
