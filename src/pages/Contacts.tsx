import { useStore } from '../context/StoreContext';

export function Contacts() {
  const { site } = useStore();

  return (
    <div className="info-page">
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
    </div>
  );
}
