import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { CompanyRequisites } from '../components/CompanyRequisites';
import { STATIC_PAGE_SEO } from '../data/seo';
import { useStore } from '../context/StoreContext';

export function Contacts() {
  const { site } = useStore();
  const seo = STATIC_PAGE_SEO.contacts;

  return (
    <div className="info-page">
      <PageMeta title={seo.title} description={seo.description} path={seo.path} />
      <h1>Контакты</h1>
      <div className="contacts-grid">
        <div>
          <h2>Телефон</h2>
          <a href={site.phoneHref} className="contact-big">
            {site.phone}
          </a>
          <p>Подбор насосов и консультация</p>
        </div>
        <div>
          <h2>Email</h2>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        <div>
          <h2>Регион</h2>
          <p>{site.city}</p>
        </div>
      </div>

      <section>
        <h2>Реквизиты продавца</h2>
        <CompanyRequisites />
      </section>

      <p className="contacts-note">
        Оформление заявки на сайте не является заключением договора до подтверждения менеджером. См.{' '}
        <Link to="/terms">условия оформления заявки</Link> и{' '}
        <Link to="/privacy">политику обработки персональных данных</Link>.
      </p>
    </div>
  );
}
