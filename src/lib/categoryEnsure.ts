import type { Category } from '../data/categories';
import { defaultCategories } from '../data/categories';
import { slugify } from './catalog';
import { resolveCanonicalCategoryName } from './categoryAliases';
import {
  NESTED_SUBCATEGORY_PARENT,
  SHEET_TO_PARENT,
  resolveParentId,
} from './categoryHierarchy';

export type CategoryMap = Map<string, Category>;

export type CategoryParentRef =
  | { kind: 'root'; rootId: string }
  | { kind: 'category'; parentName: string };

const defaultById = new Map(defaultCategories.map((c) => [c.id, c]));
const defaultByName = new Map(
  defaultCategories.map((c) => [c.name.toLowerCase(), c]),
);

/** Родитель категории: корневой раздел или имя родительской подкатегории */
export function resolveCategoryParentRef(
  categoryName: string,
  sheetName?: string,
): CategoryParentRef | undefined {
  const name = resolveCanonicalCategoryName(categoryName.trim());

  const nestedParent = NESTED_SUBCATEGORY_PARENT[name];
  if (nestedParent) {
    return { kind: 'category', parentName: nestedParent };
  }

  const rootId = resolveParentId(name, sheetName);
  if (rootId) return { kind: 'root', rootId };

  return undefined;
}

export function shouldAssignProductToRoot(categoryName: string): string | undefined {
  const name = resolveCanonicalCategoryName(categoryName.trim());
  const rootId = SHEET_TO_PARENT[name];
  if (rootId) return rootId;
  return undefined;
}

function findCategoryByName(categories: CategoryMap, name: string): Category | undefined {
  const trimmed = resolveCanonicalCategoryName(name.trim()).toLowerCase();
  for (const c of categories.values()) {
    if (c.name.toLowerCase() === trimmed) return c;
  }
  const def = defaultByName.get(trimmed);
  if (def) return categories.get(def.id) ?? def;
  return undefined;
}

function ensureRootInMap(rootId: string, categories: CategoryMap): void {
  if (categories.has(rootId)) return;
  const def = defaultById.get(rootId);
  if (def) categories.set(def.id, { ...def, parentId: undefined });
}

/** Создать или найти категорию с учётом вложенности (корень → подкатегория → под-подкатегория) */
export function upsertCategory(
  name: string,
  categories: CategoryMap,
  sheetName?: string,
): string {
  const trimmed = resolveCanonicalCategoryName(name.trim());
  if (!trimmed) return 'prochee';

  const rootOnly = shouldAssignProductToRoot(trimmed);
  if (rootOnly) {
    ensureRootInMap(rootOnly, categories);
    return rootOnly;
  }

  const existing = findCategoryByName(categories, trimmed);
  if (existing) return existing.id;

  const def = defaultByName.get(trimmed.toLowerCase());
  if (def) {
    ensureRootInMap(def.parentId ?? def.id, categories);
    if (def.parentId) ensureRootInMap(def.parentId, categories);
    categories.set(def.id, { ...def });
    return def.id;
  }

  const parentRef = resolveCategoryParentRef(trimmed, sheetName);
  let parentId: string | undefined;

  if (parentRef?.kind === 'category') {
    parentId = upsertCategory(parentRef.parentName, categories, sheetName);
  } else if (parentRef?.kind === 'root') {
    ensureRootInMap(parentRef.rootId, categories);
    parentId = parentRef.rootId;
  }

  const slug = slugify(trimmed);
  let id = slug || `cat-${categories.size}`;
  if (parentId && id === parentId) id = `${id}-cat`;

  categories.set(id, {
    id,
    slug: slug || id,
    name: trimmed,
    description: '',
    icon: '📦',
    parentId,
  });
  return id;
}

/** Объединить категории из прайса с id из defaultCategories по совпадению имени */
export function mergeDefaultCategoryIds(categories: Category[]): {
  categories: Category[];
  idRemap: Map<string, string>;
} {
  const idRemap = new Map<string, string>();

  for (const cat of categories) {
    const def = defaultByName.get(cat.name.toLowerCase());
    if (def && def.id !== cat.id) {
      idRemap.set(cat.id, def.id);
    }
  }

  const byId = new Map<string, Category>();

  for (const cat of categories) {
    const id = idRemap.get(cat.id) ?? cat.id;
    const def = defaultByName.get(cat.name.toLowerCase());
    const parentId = cat.parentId
      ? (idRemap.get(cat.parentId) ?? cat.parentId)
      : def?.parentId ?? cat.parentId;

    const next: Category = def
      ? { ...def, ...cat, id, slug: def.slug, parentId }
      : { ...cat, id, parentId };

    const prev = byId.get(id);
    if (!prev || (next.parentId && !prev.parentId)) {
      byId.set(id, next);
    }
  }

  for (const def of defaultCategories) {
    if (!byId.has(def.id)) byId.set(def.id, def);
  }

  return { categories: [...byId.values()], idRemap };
}

export function remapProductCategoryIds(
  products: { categoryId: string }[],
  idRemap: Map<string, string>,
): void {
  if (idRemap.size === 0) return;
  for (const p of products) {
    const next = idRemap.get(p.categoryId);
    if (next) p.categoryId = next;
  }
}
