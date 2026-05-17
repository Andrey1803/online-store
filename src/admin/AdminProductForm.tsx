import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Product } from '../data/products';
import { useStore } from '../context/StoreContext';
import { slugify } from '../lib/catalog';
import { saveProductImage, toIdbImageRef } from '../lib/productImageStore';
import { fileToImageDataUrl } from '../utils/imageUpload';
import './admin.css';

const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#0c4a6e', '#16a34a', '#64748b', '#ea580c', '#dc2626'];

function emptyProduct(): Product {
  return {
    id: crypto.randomUUID(),
    slug: '',
    name: '',
    brand: '',
    categoryId: 'nasosy',
    price: 0,
    description: '',
    specs: [{ label: '', value: '' }],
    inStock: true,
    featured: false,
    imageColor: COLORS[0],
  };
}

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, categories, getProductById, saveProduct } = useStore();
  const isNew = id === 'new';

  const [form, setForm] = useState<Product>(() => {
    if (isNew) return emptyProduct();
    return getProductById(id!) ?? emptyProduct();
  });
  const [imageError, setImageError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      const p = getProductById(id);
      if (p) setForm(p);
    }
  }, [id, isNew, getProductById]);

  const update = <K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    setImageError('');
    try {
      const dataUrl = await fileToImageDataUrl(file);
      update('image', dataUrl);
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Ошибка загрузки');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug.trim() || slugify(form.name);
    const uniqueSlug = products.some((p) => p.slug === slug && p.id !== form.id)
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    const article = form.article ?? form.id;
    let image = form.image;
    if (image?.startsWith('data:')) {
      await saveProductImage(article, image);
      image = toIdbImageRef(article);
    }

    saveProduct({
      ...form,
      article,
      slug: uniqueSlug,
      price: Number(form.price) || 0,
      oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
      specs: form.specs.filter((s) => s.label.trim() || s.value.trim()),
      image,
    });
    setSaved(true);
    setTimeout(() => navigate('/admin/products'), 600);
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h1>{isNew ? 'Новый товар' : 'Редактирование'}</h1>
          <Link to="/admin/products" className="subtitle">
            ← К списку
          </Link>
        </div>
      </div>

      {saved && <p className="admin-success">Сохранено!</p>}

      <form onSubmit={handleSubmit} className="admin-card admin-form">
        <div className="admin-form-grid">
          <label>
            Название *
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  slug: f.slug || slugify(name),
                }));
              }}
            />
          </label>
          <label>
            URL (slug)
            <input
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              placeholder="avto-iz-sluga"
            />
          </label>
          <label>
            Бренд
            <input value={form.brand} onChange={(e) => update('brand', e.target.value)} />
          </label>
          <label>
            Категория *
            <select
              required
              value={form.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? '— ' : ''}
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Цена (BYN) *
            <input
              type="number"
              min={0}
              step={0.01}
              required
              value={form.price || ''}
              onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
            />
          </label>
          <label>
            Старая цена
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.oldPrice ?? ''}
              onChange={(e) =>
                update('oldPrice', e.target.value ? parseFloat(e.target.value) : undefined)
              }
            />
          </label>
          <label>
            Цвет плейсхолдера
            <select
              value={form.imageColor}
              onChange={(e) => update('imageColor', e.target.value)}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Описание
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>

        <div className="admin-form-row">
          <label>
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => update('inStock', e.target.checked)}
            />
            В наличии
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.featured ?? false}
              onChange={(e) => update('featured', e.target.checked)}
            />
            На главной
          </label>
        </div>

        <label>Фото товара</label>
        <div className="image-upload">
          {form.image && (
            <img src={form.image} alt="" className="image-upload-preview" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />
          {form.image && (
            <button
              type="button"
              className="admin-btn-sm danger"
              style={{ marginTop: '0.75rem' }}
              onClick={() => update('image', undefined)}
            >
              Удалить фото
            </button>
          )}
        </div>
        {imageError && <p className="admin-error">{imageError}</p>}

        <label style={{ marginTop: '1.5rem' }}>Характеристики</label>
        <div className="specs-editor">
          {form.specs.map((spec, i) => (
            <div key={i} className="spec-row">
              <input
                placeholder="Параметр"
                value={spec.label}
                onChange={(e) => {
                  const specs = [...form.specs];
                  specs[i] = { ...spec, label: e.target.value };
                  update('specs', specs);
                }}
              />
              <input
                placeholder="Значение"
                value={spec.value}
                onChange={(e) => {
                  const specs = [...form.specs];
                  specs[i] = { ...spec, value: e.target.value };
                  update('specs', specs);
                }}
              />
              <button
                type="button"
                className="admin-btn-sm danger"
                onClick={() => update('specs', form.specs.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn-sm"
            onClick={() => update('specs', [...form.specs, { label: '', value: '' }])}
          >
            + Характеристика
          </button>
        </div>

        <div className="admin-toolbar" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          <button type="submit" className="admin-btn-primary">
            Сохранить
          </button>
          <Link to="/admin/products" className="admin-btn-sm">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
