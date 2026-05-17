import { useState } from 'react';
import type { Category } from '../data/categories';
import { slugify } from '../lib/catalog';
import { useStore } from '../context/StoreContext';
import './admin.css';

function emptyCategory(): Category {
  return {
    id: crypto.randomUUID(),
    slug: '',
    name: '',
    description: '',
    icon: '📦',
  };
}

export function AdminCategories() {
  const { categories, saveCategory, deleteCategory } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState('');

  const startEdit = (cat?: Category) => {
    setEditing(cat ? { ...cat } : emptyCategory());
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const slug = editing.slug.trim() || slugify(editing.name);
    saveCategory({ ...editing, slug });
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!deleteCategory(id)) {
      setError('Нельзя удалить: есть товары или подкатегории');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h1>Категории</h1>
          <p className="subtitle">{categories.length} разделов</p>
        </div>
        <button type="button" className="admin-btn-primary" onClick={() => startEdit()}>
          + Добавить
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {editing && (
        <form onSubmit={handleSave} className="admin-card admin-form">
          <h2>{editing.id && categories.some((c) => c.id === editing.id) ? 'Изменить' : 'Новая'}</h2>
          <div className="admin-form-grid">
            <label>
              Название *
              <input
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })
                }
              />
            </label>
            <label>
              Slug
              <input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
            </label>
            <label>
              Иконка (emoji)
              <input
                value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
              />
            </label>
            <label>
              Родительская категория
              <select
                value={editing.parentId ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, parentId: e.target.value || undefined })
                }
              >
                <option value="">— Корневая —</option>
                {categories
                  .filter((c) => !c.parentId && c.id !== editing.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label>
            Описание
            <textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </label>
          <div className="admin-toolbar" style={{ marginBottom: 0 }}>
            <button type="submit" className="admin-btn-primary">
              Сохранить
            </button>
            <button type="button" className="admin-btn-sm" onClick={() => setEditing(null)}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="admin-card" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Название</th>
              <th>Slug</th>
              <th>Родитель</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.icon}</td>
                <td>{c.name}</td>
                <td>
                  <code>{c.slug}</code>
                </td>
                <td>{categories.find((p) => p.id === c.parentId)?.name ?? '—'}</td>
                <td>
                  <div className="admin-actions">
                    <button type="button" className="admin-btn-sm" onClick={() => startEdit(c)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="admin-btn-sm danger"
                      onClick={() => {
                        if (confirm(`Удалить «${c.name}»?`)) handleDelete(c.id);
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
