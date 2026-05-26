import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { COMPANY } from '../data/company';
import { STATIC_PAGE_SEO } from '../data/seo';
import { useStore } from '../context/StoreContext';

export function Delivery() {
  const { site } = useStore();
  const seo = STATIC_PAGE_SEO.delivery;

  return (
    <div className="info-page">
      <PageMeta title={seo.title} description={seo.description} path={seo.path} />
      <h1>Доставка и оплата</h1>
      <section>
        <h2>Доставка</h2>
        <ul>
          <li>Доставка по {site.city} — от 15 BYN (уточняется при подтверждении заявки)</li>
          <li>Самовывоз — по согласованию, бесплатно</li>
          <li>Отправка в регионы Республики Беларусь — транспортными компаниями</li>
        </ul>
      </section>
      <section>
        <h2>Оплата</h2>
        <ul>
          <li>Наличными при получении (физические лица)</li>
          <li>Безналичный расчёт по счёту для юридических лиц и ИП</li>
          <li>Банковский перевод на расчётный счёт ЧТУП — реквизиты в разделе <Link to="/contacts">Контакты</Link></li>
        </ul>
      </section>
      <section>
        <h2>Цены</h2>
        <p>
          Все цены на сайте указаны в <strong>белорусских рублях (BYN)</strong> и{' '}
          <strong>включают НДС {COMPANY.vatRate}%</strong> (продавец — плательщик НДС). {site.markupNote}
        </p>
        <p>
          При безналичной оплате для организаций оформляется счёт и счёт-фактура с выделением НДС.
        </p>
      </section>
      <section>
        <h2>Возврат и гарантия</h2>
        <p>
          Условия возврата, обмена и гарантийного обслуживания — в разделе{' '}
          <Link to="/returns">Возврат и гарантия</Link>.
        </p>
      </section>
      <section>
        <h2>Оформление заявки</h2>
        <p>
          Порядок оформления и заключения договора — в{' '}
          <Link to="/terms">Условиях оформления заявки</Link>.
        </p>
      </section>
    </div>
  );
}
