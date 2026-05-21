import { useState } from 'react';
import {
  extractImageEntriesFromExcel,
  parseAkvabregFile,
  type ImportResult,
  type PriceMode,
} from '../lib/akvabregImport';
import {
  clearAllProductImages,
  saveProductImagesBatch,
  toIdbImageRef,
} from '../lib/productImageStore';
import { useStore } from '../context/StoreContext';
import type { Product } from '../data/products';
import './admin.css';

async function prepareProductsForStore(products: Product[]): Promise<Product[]> {
  const imageEntries: { article: string; dataUrl: string }[] = [];
  const prepared = products.map((p) => {
    if (p.image?.startsWith('data:') && p.article) {
      imageEntries.push({ article: p.article, dataUrl: p.image });
      return { ...p, image: toIdbImageRef(p.article) };
    }
    return p;
  });
  if (imageEntries.length > 0) {
    await saveProductImagesBatch(imageEntries);
  }
  return prepared;
}

export function AdminImport() {
  const {
    importCatalog,
    products,
    categories,
    clearStrikethroughPrices,
    repairCatalog,
    applyProductImageRefs,
  } = useStore();
  const [priceMode, setPriceMode] = useState<PriceMode>('rrc');
  const [markup, setMarkup] = useState(25);
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const [importImages, setImportImages] = useState(true);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState('');
  const [saving, setSaving] = useState(false);
  const [restoringImages, setRestoringImages] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setDone('');
    setLoading(true);
    setProgress('Читаем файл…');
    try {
      const buffer = await file.arrayBuffer();
      const result = await parseAkvabregFile(
        buffer,
        { priceMode, markupPercent: markup, importImages },
        categories,
        setProgress,
      );
      setPreview(result);
      if (result.products.length === 0) {
        setError('Товары не найдены. Проверьте формат файла (akvabreg_full или akvabreg_mega).');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка чтения файла');
      setPreview(null);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const applyImport = async () => {
    if (!preview) return;
    setSaving(true);
    setProgress('Сохраняем фото…');
    try {
      let toSave = preview.products;
      if (priceMode === 'rrc') {
        toSave = preview.products.map((p) => {
          const { oldPrice: _, ...rest } = p;
          return rest;
        });
      }
      const prepared = await prepareProductsForStore(toSave);
      importCatalog({ products: prepared, categories: preview.categories }, mode);
      setDone(
        `Готово: ${preview.stats.imported} товаров, фото: ${preview.stats.withPhotos}.`,
      );
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  return (
    <div className="admin-page">
      <h1>Импорт из Excel</h1>
      <p className="subtitle">
        Прайсы AkvaBreg с встроенными фото в ячейках. Сейчас в магазине: {products.length} товаров.
      </p>

      <div className="admin-card admin-form">
        <h2>Настройки</h2>
        <div className="admin-form-grid">
          <label>
            Откуда брать цену
            <select
              value={priceMode}
              onChange={(e) => setPriceMode(e.target.value as PriceMode)}
            >
              <option value="rrc">РРЦ (как в прайсе)</option>
              <option value="markup">ОПТ 2 + наценка %</option>
              <option value="opt2">ОПТ 2 (закупка)</option>
            </select>
          </label>
          {priceMode === 'rrc' && (
            <p className="admin-hint" style={{ gridColumn: '1 / -1', margin: 0 }}>
              На сайте будет только колонка РРЦ из Excel, без перечёркнутой цены.
              Импортируйте с режимом «Заменить каталог», если раньше загружали с наценкой.
            </p>
          )}
          {priceMode === 'markup' && (
            <label>
              Наценка, %
              <input
                type="number"
                min={0}
                max={200}
                value={markup}
                onChange={(e) => setMarkup(Number(e.target.value) || 0)}
              />
            </label>
          )}
          <label>
            Режим
            <select value={mode} onChange={(e) => setMode(e.target.value as 'replace' | 'merge')}>
              <option value="replace">Заменить каталог</option>
              <option value="merge">Обновить по артикулу</option>
            </select>
          </label>
        </div>
        <label className="admin-form-row">
          <input
            type="checkbox"
            checked={importImages}
            onChange={(e) => setImportImages(e.target.checked)}
          />
          Импортировать фото из Excel (встроены в прайс, колонка «Фото»)
        </label>

        <label className="image-upload" style={{ marginTop: '1rem' }}>
          <strong>Файл .xlsx</strong>
          <input
            type="file"
            accept=".xlsx,.xls"
            disabled={loading || saving}
            onChange={(e) => handleFile(e.target.files?.[0])}
            style={{ marginTop: '0.75rem' }}
          />
        </label>
        {(loading || saving) && progress && <p>{progress}</p>}
        {loading && !progress && <p>Обработка…</p>}
        {error && <p className="admin-error">{error}</p>}
        {done && <p className="admin-success">{done}</p>}
      </div>

      {preview && (
        <div className="admin-card">
          <h2>Предпросмотр</h2>
          <ul style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li>Товаров: {preview.stats.imported}</li>
            <li>С фото: {preview.stats.withPhotos}</li>
            <li>Без цены: {preview.stats.noPrice}</li>
            <li>Листов: {preview.stats.sheets.length}</li>
          </ul>
          <table className="admin-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th></th>
                <th>Артикул</th>
                <th>Название</th>
                <th>Цена</th>
              </tr>
            </thead>
            <tbody>
              {preview.products.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td className="thumb-cell">
                    {p.image ? (
                      <img src={p.image} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{p.article}</td>
                  <td>{p.name.slice(0, 45)}</td>
                  <td>{p.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="admin-btn-primary"
            style={{ marginTop: '1rem' }}
            disabled={saving}
            onClick={applyImport}
          >
            {saving ? 'Сохранение…' : `Импортировать ${preview.stats.imported} товаров`}
          </button>
        </div>
      )}

      <div className="admin-card">
        <h2>Уже импортировали с наценкой?</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Перечёркнутая цена появлялась при режиме «ОПТ 2 + наценка». Чтобы на сайте была только{' '}
          <strong>РРЦ</strong>, заново загрузите Excel: режим цены «РРЦ», импорт «Заменить каталог».
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => {
              repairCatalog();
              setDone('Категории пересобраны: товары распределены по подкатегориям.');
            }}
          >
            Исправить категории
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => {
              clearStrikethroughPrices();
              setDone('Перечёркнутые цены убраны. Для обновления сумм до РРЦ нужен повторный импорт.');
            }}
          >
            Убрать перечёркивание цен
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h2>Фото товаров</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>
          В прайсе фото мелкие — на сайте они показываются в уменьшенном виде (без
          растягивания). Сохраняются <strong>как в Excel</strong>, без пережатия. После смены
          настроек — <strong>восстановите фото из .xlsx</strong> заново.
        </p>
        <label className="image-upload" style={{ marginTop: '0.75rem', display: 'block' }}>
          <strong>Восстановить фото из Excel</strong>
          <input
            type="file"
            accept=".xlsx,.xls"
            disabled={restoringImages || loading || saving}
            style={{ marginTop: '0.5rem', display: 'block' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setRestoringImages(true);
              setError('');
              setProgress('Очищаем старые фото…');
              try {
                const removed = await clearAllProductImages();
                const buffer = await file.arrayBuffer();
                const entries = await extractImageEntriesFromExcel(buffer, setProgress);
                if (entries.length === 0) {
                  setError('Фото в файле не найдены.');
                  return;
                }
                setProgress('Сохраняем фото…');
                await saveProductImagesBatch(entries, (done, total) => {
                  setProgress(`Сохранено: ${done} / ${total}`);
                });
                applyProductImageRefs(entries.map((x) => x.article));
                setDone(
                  `Готово: ${entries.length} фото из прайса (удалено старых: ${removed}). Обновите сайт (F5).`,
                );
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка восстановления фото');
              } finally {
                setRestoringImages(false);
                setProgress('');
                e.target.value = '';
              }
            }}
          />
        </label>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Или полный импорт каталога ниже с галочкой «Импортировать фото».
        </p>
        <p
          style={{
            color: '#0f766e',
            fontSize: '0.85rem',
            marginTop: '1rem',
            lineHeight: 1.6,
            padding: '0.75rem',
            background: '#f0fdfa',
            borderRadius: 8,
          }}
        >
          <strong>Сайт на akvasnab.by:</strong> импорт в админке сохраняет данные только в этом браузере.
          Чтобы каталог и фото видели все посетители, на компьютере с прайсом выполните{' '}
          <code>npm run export-catalog -- путь\к\прайсу.xlsx</code>, затем{' '}
          <code>npm run deploy:domen</code> (заливка на хостинг domen.by).
        </p>
      </div>
    </div>
  );
}
