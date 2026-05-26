import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { CompanyRequisites } from '../components/CompanyRequisites';
import { COMPANY } from '../data/company';
import { STATIC_PAGE_SEO } from '../data/seo';
import { useStore } from '../context/StoreContext';

export function About() {
  const { site } = useStore();
  const seo = STATIC_PAGE_SEO.about;

  return (
    <article className="info-page legal-doc">
      <PageMeta title={seo.title} description={seo.description} path={seo.path} />
      <h1>О компании</h1>
      <p>
        <strong>{site.name}</strong> — интернет-витрина {COMPANY.shortName}. Мы подбираем и поставляем
        насосное оборудование, гидроаккумуляторы, автоматику и комплектующие для водоснабжения в{' '}
        {site.city} и по Республике Беларусь.
      </p>
      <p>{site.heroText}</p>

      <section>
        <h2>Реквизиты</h2>
        <CompanyRequisites />
      </section>

      <section>
        <h2>Документы сайта</h2>
        <ul>
          <li>
            <Link to="/privacy">Политика обработки персональных данных</Link>
          </li>
          <li>
            <Link to="/terms">Условия оформления заявки</Link>
          </li>
          <li>
            <Link to="/returns">Возврат, обмен и гарантия</Link>
          </li>
          <li>
            <Link to="/delivery">Доставка и оплата</Link>
          </li>
          <li>
            <Link to="/contacts">Контакты</Link>
          </li>
        </ul>
      </section>

      <p className="legal-disclaimer">
        Торговая марка {site.name} используется для обозначения интернет-магазина {COMPANY.shortName}.
        Указанные на сайте товарные знаки принадлежат их правообладателям и используются исключительно
        для идентификации товаров.
      </p>
    </article>
  );
}
