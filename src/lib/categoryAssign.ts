import type { Category } from '../data/categories';
import { defaultCategories } from '../data/categories';
import type { Product } from '../data/products';
import { slugify } from './catalog';
import { resolveCanonicalCategoryName } from './categoryAliases';
import { resolveParentId, SHEET_TO_PARENT, SUBCATEGORY_PARENT } from './categoryHierarchy';
import { parseConnectionType } from './productSpecs';
import { collectCategoryTreeIds } from './catalog';

const ROOT_IDS = new Set(
  defaultCategories.filter((c) => !c.parentId).map((c) => c.id),
);

export function isParentSheet(sheetName: string): boolean {
  return Boolean(SHEET_TO_PARENT[sheetName.trim()]);
}

export function isSubcategorySheet(sheetName: string): boolean {
  const s = sheetName.trim();
  return Boolean(SUBCATEGORY_PARENT[s]) && !isParentSheet(s);
}

export function inferCategoryFromProduct(
  productName: string,
  sheetName: string,
  description = '',
): string | undefined {
  const n = productName.toLowerCase();
  const combined = `${productName} ${description}`.toLowerCase();

  if (/\bпэ\b|полиэтилен|пнд|пвд|pe\s*100|pe-100/.test(n)) {
    return 'Труба питьевая';
  }
  if (/ppr|ппр|полипропиленов/.test(n)) {
    return 'Полипропиленовые трубы';
  }
  if (/труборез|ножниц/.test(n)) {
    return 'Комплектующие';
  }
  if (/фитинг|муфта|тройник|угольник|кран|вентил/.test(n) && sheetName === 'Полипропилен') {
    if (/пэ|полиэтилен/.test(n)) return 'Труба питьевая';
    return 'Полипропиленовые фитинги';
  }
  if (/^труба\b/.test(n) && sheetName === 'Полипропилен') {
    if (/пэ|полиэтилен/.test(n)) return 'Труба питьевая';
    return 'Полипропиленовые трубы';
  }

  if (sheetName === 'Комплектующие') {
    if (/\bкран\b|шаровый кран|кран шаров/i.test(n) && !/кранштейн/.test(n)) {
      return 'Краны';
    }
    if (/латун|муфт|тройник|угольник|ниппель|американк|фитинг|отвод\b|сгон|футорк/.test(n)) {
      if (!/ппр|ppr|полипропилен/.test(n)) return 'Фитинги латунные';
    }
    if (/компрессионн/.test(n)) return 'Компрессионные муфты';
    const conn = parseConnectionType(combined)?.toLowerCase();
    if (
      conn &&
      /заглушк|муфт|тройник|угольник|отвод|переход|штуцер|соединител/.test(conn) &&
      (/полиэтилен|пэ\b|poelsan|компрессионн/.test(combined) || /компрессионн/.test(n))
    ) {
      return 'Компрессионные муфты';
    }
    if (/заглушк/.test(n) && /компрессионн/.test(n)) return 'Компрессионные муфты';
    if (/обратн/.test(n) && /клапан/.test(n)) return 'Обратные клапана';
    if (/манометр/.test(n)) return 'Манометры';
    if (/оголовок/.test(n)) return 'Оголовки скважинные';
    if (/адаптер/.test(n) && /скважин/.test(n)) return 'Адаптеры для скважин';
    if (/трос|зажим/.test(n)) return 'Трос и зажимы';
    if (/обсадн/.test(n) && /труб/.test(n)) return 'Обсадные трубы для скважины';
    if (/гибк/.test(n) && /подводк/.test(n)) return 'Гибкие подводки';
  }

  return undefined;
}

/** @deprecated используйте inferCategoryFromProduct */
export function inferCategoryFromProductName(
  productName: string,
  sheetName: string,
  description = '',
): string | undefined {
  return inferCategoryFromProduct(productName, sheetName, description);
}

export function resolveProductCategoryName(
  productName: string,
  typeFromExcel: string,
  sheetName: string,
  description = '',
): string {
  const sheet = sheetName.trim();
  const type = resolveCanonicalCategoryName(typeFromExcel.trim());

  if (isSubcategorySheet(sheet)) {
    return sheet;
  }

  if (isParentSheet(sheet)) {
    if (type && type !== sheet && SUBCATEGORY_PARENT[type]) return type;
    if (type && type !== sheet && !isParentSheet(type)) return type;
    const inferred = inferCategoryFromProduct(productName, sheet, description);
    if (inferred) return inferred;
    return sheet;
  }

  if (type && SUBCATEGORY_PARENT[type]) return type;
  if (type) return type;
  return sheet || 'Прочее';
}

/** Подкатегории без parentId вешаем на корневой раздел */
export function foldCategoriesIntoRoots(categories: Category[]): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));

  return categories.map((cat) => {
    if (ROOT_IDS.has(cat.id)) {
      return cat.parentId ? { ...cat, parentId: undefined } : cat;
    }

    if (cat.parentId && byId.has(cat.parentId)) {
      return cat;
    }

    const parentId = resolveParentId(cat.name);
    if (parentId && parentId !== cat.id) {
      return { ...cat, parentId };
    }

    return cat;
  });
}

export function repairCategoryTree(categories: Category[]): Category[] {
  const folded = foldCategoriesIntoRoots(categories);
  const byId = new Map(folded.map((c) => [c.id, c]));

  return folded.map((cat) => {
    if (ROOT_IDS.has(cat.id)) {
      return cat.parentId ? { ...cat, parentId: undefined } : cat;
    }

    const mapped = resolveParentId(cat.name);
    let parentId = mapped ?? cat.parentId;
    if (parentId && !byId.has(parentId)) {
      parentId = mapped ?? undefined;
    }
    if (parentId === cat.id) parentId = undefined;

    if (parentId !== cat.parentId) {
      return { ...cat, parentId };
    }
    return cat;
  });
}

export function repairProductCategories(
  products: Product[],
  categories: Category[],
): { products: Product[]; categories: Category[] } {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  const extraCats = new Map<string, Category>();

  const ensureCat = (name: string, sheetHint?: string): string => {
    const trimmed = resolveCanonicalCategoryName(name);
    const slug = slugify(trimmed);
    const existing = catBySlug.get(slug) ?? catByName.get(trimmed.toLowerCase());
    if (existing) return existing.id;

    if (extraCats.has(slug)) return extraCats.get(slug)!.id;

    let parentId = resolveParentId(trimmed, sheetHint);
    let id = slug || `cat-${extraCats.size}`;
    if (parentId && id === parentId) id = `${id}-cat`;

    const cat: Category = {
      id,
      slug: slug || id,
      name: trimmed,
      description: '',
      icon: '📦',
      parentId,
    };
    extraCats.set(slug, cat);
    catBySlug.set(slug, cat);
    catByName.set(trimmed.toLowerCase(), cat);
    return id;
  };

  const repairedProducts = products.map((p) => {
    const current = catMap.get(p.categoryId);
    if (!current) return p;

    // Товары в корневом разделе (avtomatika, nasosy, …) — не разносить по эвристике
    if (ROOT_IDS.has(p.categoryId)) {
      return p;
    }

    // Пустая «псевдо-подкатегория» с именем листа Excel → в корневой раздел
    if (
      current.parentId &&
      ROOT_IDS.has(current.parentId) &&
      SHEET_TO_PARENT[current.name.trim()] === current.parentId
    ) {
      return { ...p, categoryId: current.parentId };
    }

    const sectionName = isParentSheet(current.name) ? current.name : undefined;
    let targetName = current.name;

    // Листовая подкатегория с parentId — оставляем как в прайсе
    if (current.parentId && !isParentSheet(current.name) && current.name !== 'Комплектующие') {
      return p;
    }

    if (isParentSheet(current.name) || current.name === 'Полипропилен') {
      const sheet = current.name === 'Полипропилен' ? 'Полипропилен' : current.name;
      const inferred = inferCategoryFromProduct(p.name, sheet, p.description);
      if (inferred) targetName = inferred;
    } else if (!current.parentId || current.name === 'Комплектующие') {
      const inferred = inferCategoryFromProduct(
        p.name,
        sectionName ?? current.name,
        p.description,
      );
      if (inferred) targetName = inferred;
    }

    if (targetName === current.name && current.parentId) {
      return p;
    }

    const newId = ensureCat(targetName, sectionName);
    return newId !== p.categoryId ? { ...p, categoryId: newId } : p;
  });

  const allCategories = repairCategoryTree([...categories, ...extraCats.values()]);

  return {
    products: repairedProducts,
    categories: pruneEmptyCategories(allCategories, repairedProducts),
  };
}

/** Убрать пустые дубликаты подкатегорий (усечённые названия листов Excel) */
export function pruneEmptyCategories(
  categories: Category[],
  products: Product[],
): Category[] {
  const hasProductsInTree = (catId: string): boolean => {
    const ids = collectCategoryTreeIds(categories, catId);
    return products.some((p) => ids.has(p.categoryId));
  };

  return categories.filter((c) => {
    if (ROOT_IDS.has(c.id)) return true;
    return hasProductsInTree(c.id);
  });
}
