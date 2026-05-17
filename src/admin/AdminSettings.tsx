import { useState } from 'react';
import type { SiteConfig } from '../config';
import { useStore } from '../context/StoreContext';
import './admin.css';

export function AdminSettings() {
  const { site, updateSite, products, categories } = useStore();
  const [form, setForm] = useState<SiteConfig>(site);
  const [saved, setSaved] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const update = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = form.phone.replace(/\D/g, '');
    const phoneHref = phoneDigits ? `tel:+${phoneDigits}` : form.phoneHref;
    updateSite({ ...form, phoneHref });
    setSaved(true);
  };

  const exportData = () => {
    const data = { site: form, products, categories, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `akvasnab-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg('Файл скачан');
  };

  const importData = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.site) updateSite(data.site);
        if (data.products) localStorage.setItem('akvasnab-products', JSON.stringify(data.products));
        if (data.categories) localStorage.setItem('akvasnab-categories', JSON.stringify(data.categories));
        setExportMsg('Импорт выполнен — перезагрузите страницу');
        window.location.reload();
      } catch {
        setExportMsg('Ошибка: неверный JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="admin-page">
      <h1>Настройки сайта</h1>
      <p className="subtitle">Контакты, тексты на главной</p>

      {saved && <p className="admin-success">Сохранено!</p>}

      <form onSubmit={handleSubmit} className="admin-card admin-form">
        <div className="admin-form-grid">
          <label>
            Название магазина
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </label>
          <label>
            Слоган
            <input value={form.tagline} onChange={(e) => update('tagline', e.target.value)} />
          </label>
          <label>
            Телефон
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <label>
            Регион доставки
            <input value={form.city} onChange={(e) => update('city', e.target.value)} />
          </label>
          <label>
            Примечание к ценам
            <input value={form.markupNote} onChange={(e) => update('markupNote', e.target.value)} />
          </label>
        </div>
        <label>
          Заголовок на главной
          <input value={form.heroTitle} onChange={(e) => update('heroTitle', e.target.value)} />
        </label>
        <label>
          Текст на главной
          <textarea
            rows={3}
            value={form.heroText}
            onChange={(e) => update('heroText', e.target.value)}
          />
        </label>
        <button type="submit" className="admin-btn-primary">
          Сохранить
        </button>
      </form>

      <div className="admin-card">
        <h2>Резервная копия</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Экспорт и импорт всех товаров, категорий и настроек в JSON.
        </p>
        <div className="admin-toolbar" style={{ marginBottom: 0 }}>
          <button type="button" className="admin-btn-primary" onClick={exportData}>
            Скачать JSON
          </button>
          <label className="admin-btn-sm" style={{ cursor: 'pointer' }}>
            Загрузить JSON
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => importData(e.target.files?.[0])}
            />
          </label>
        </div>
        {exportMsg && <p className="admin-success" style={{ marginTop: '1rem' }}>{exportMsg}</p>}
      </div>
    </div>
  );
}
