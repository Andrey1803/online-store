import { useStore } from '../context/StoreContext';

export function Delivery() {
  const { site } = useStore();

  return (
    <div className="info-page">
      <h1>Доставка и оплата</h1>
      <section>
        <h2>Доставка</h2>
        <ul>
          <li>Доставка по {site.city} — от 15 BYN</li>
          <li>Самовывоз — бесплатно</li>
          <li>Отправка в регионы — транспортными компаниями</li>
        </ul>
      </section>
      <section>
        <h2>Оплата</h2>
        <ul>
          <li>Наличными при получении</li>
          <li>Безналичный расчёт для юридических лиц</li>
        </ul>
      </section>
      <section>
        <h2>Важно</h2>
        <p>{site.markupNote}</p>
      </section>
    </div>
  );
}
