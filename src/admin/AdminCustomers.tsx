import { listCustomerProfiles } from '../lib/customerStore';
import { formatOrderDate } from '../lib/formatDate';
import './admin.css';

export function AdminCustomers() {
  const customers = listCustomerProfiles();

  return (
    <div className="admin-page">
      <h1>Клиенты</h1>
      <p className="subtitle">
        Зарегистрированные покупатели (хранятся в браузере, как и заявки).
      </p>

      {customers.length === 0 ? (
        <div className="admin-card">
          <p style={{ color: '#64748b', margin: 0 }}>
            Пока никто не зарегистрировался. Регистрация на сайте: «Войти» в шапке.
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>E-mail</th>
                <th>Телефон</th>
                <th>Регистрация</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <a href={`mailto:${c.email}`}>{c.email}</a>
                  </td>
                  <td>
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
                  </td>
                  <td>{formatOrderDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
