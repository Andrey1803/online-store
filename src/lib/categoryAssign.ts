import type { Category } from '../data/categories';
import { defaultCategories } from '../data/categories';
import type { Product } from '../data/products';
import { resolveCanonicalCategoryName } from './categoryAliases';
import {
  mergeDefaultCategoryIds,
  remapProductCategoryIds,
  resolveCategoryParentRef,
  upsertCategory,
  type CategoryMap,
} from './categoryEnsure';
import {
  NESTED_SUBCATEGORY_PARENT,
  resolveParentId,
  SHEET_TO_PARENT,
  SUBCATEGORY_PARENT,
} from './categoryHierarchy';
import { parseConnectionType } from './productSpecs';
import { collectCategoryTreeIds, getRootCategoryId } from './catalog';

const COMPRESSION_CATEGORY = 'Компрессионные муфты';
const COMBINED_FITTINGS = 'Комбинированные фитинги';

/** Подтип комбинированных фитингов PPR по названию товара */
function inferCombinedFittingSubType(productName: string): string | undefined {
  const n = productName.toLowerCase();
  if (/тройник/.test(n)) return 'Тройники комбинированные с НР';
  if (/муфт/.test(n) && /разъем/.test(n)) return 'Муфты разъемные с НР';
  if (/муфт/.test(n) && /соединител/.test(n)) return 'Муфты соединительные';
  if (/муфт/.test(n) && (/шланг|рукав/.test(n))) {
    return 'Муфта комбинированная для шлангов рукавов';
  }
  if (/муфт/.test(n)) return 'Муфты комбинированные с НР';
  return undefined;
}

function isCompressionProduct(
  productName: string,
  description = '',
  categoryName?: string,
): boolean {
  const text = `${productName} ${description}`.toLowerCase();
  if (/компрессион/.test(text)) return true;
  if (categoryName && /компрессион/.test(categoryName)) return true;
  if (
    /\b(муфт|фитинг|тройник|угольник|отвод|заглушк|переход|соединител)\b/.test(text) &&
    /\b(пэ|пнд|pnd|полиэтилен|poelsan)\b/.test(text) &&
    !/ppr|ппр|полипропилен|unidelta|valtec|meerplast/i.test(text)
  ) {
    return true;
  }
  return false;
}

function isInCategoryTree(categories: Category[], categoryId: string, rootId: string): boolean {
  try {
    return getRootCategoryId(categories, categoryId) === rootId;
  } catch {
    return false;
  }
}

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

  if (/компрессионн/.test(n) || /компрессионн/.test(combined)) {
    return COMPRESSION_CATEGORY;
  }

  if (/\bпэ\b|полиэтилен|пнд|пвд|pe\s*100|pe-100/.test(n)) {
    if (/^труба\b/.test(n) || (/\bтруб/.test(n) && !/муфт|фитинг|тройник/.test(n))) {
      return 'Труба питьевая';
    }
    if (/муфт|фитинг|тройник|угольник|отвод|заглушк|переход/.test(n)) {
      return COMPRESSION_CATEGORY;
    }
    return 'Труба питьевая';
  }
  if (/ppr|ппр|полипропиленов/.test(n)) {
    return 'Полипропиленовые трубы';
  }
  if (/труборез|ножниц/.test(n)) {
    return 'Комплектующие';
  }
  if (/фитинг|муфта|тройник|угольник|кран|вентил/.test(n) && sheetName === 'Полипропилен') {
    if (/пэ|полиэтилен|poelsan/.test(n) && !/ppr|ппр|полипропилен/.test(n)) {
      return COMPRESSION_CATEGORY;
    }
    return 'Полипропиленовые фитинги';
  }
  if (/^труба\b/.test(n) && sheetName === 'Полипропилен') {
    if (/пэ|полиэтилен/.test(n)) return 'Труба питьевая';
    return 'Полипропиленовые трубы';
  }

  if (sheetName === 'Автоматика для насосов') {
    if (/частот|преобразовател|инвертор|vfd/i.test(n)) return 'Частотные блоки управления';
    if (/механическ|реле давления|минимальн.*давлен/i.test(n)) {
      return 'Механические блоки управления';
    }
    if (/готов.*систем|комплект.*автомат|станц/i.test(n)) {
      return 'Готовые системы автоматики';
    }
    if (/блок|управлен|контроллер|электрон|реле/i.test(n)) {
      return 'Электронные блоки управления';
    }
  }

  if (sheetName === 'Запасные части') {
    if (/двигател|мотор/.test(n)) return 'Двигатели для насосов';
    if (/крыльчатк/.test(n)) return 'Крыльчатки для насосов';
    if (/сальник/.test(n)) return 'Сальники для насосов';
    if (/ротор|статор/.test(n)) return 'Статора и роторы';
    if (/ремкомплект|уплотнит.*кольц/.test(n)) return 'Ремкомплект';
    if (/диффузор/.test(n)) return 'Диффузоры для насоса';
    if (/измельчител/.test(n)) return 'Измельчители';
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
    if (type && type !== sheet && (SUBCATEGORY_PARENT[type] || NESTED_SUBCATEGORY_PARENT[type])) {
      return type;
    }
    if (type && type !== sheet && !isParentSheet(type)) return type;
    const inferred = inferCategoryFromProduct(productName, sheet, description);
    if (inferred) return inferred;
    return sheet;
  }

  if (type && (SUBCATEGORY_PARENT[type] || NESTED_SUBCATEGORY_PARENT[type])) return type;
  if (type) return type;
  return sheet || 'Прочее';
}

function resolveParentCategoryId(
  cat: Category,
  byName: Map<string, Category>,
): string | undefined {
  const nestedParentName = NESTED_SUBCATEGORY_PARENT[cat.name.trim()];
  if (nestedParentName) {
    const parentCat = byName.get(nestedParentName.toLowerCase());
    if (parentCat) return parentCat.id;
  }

  const ref = resolveCategoryParentRef(cat.name);
  if (ref?.kind === 'category') {
    const parentCat = byName.get(ref.parentName.toLowerCase());
    if (parentCat) return parentCat.id;
  }
  if (ref?.kind === 'root') return ref.rootId;

  return resolveParentId(cat.name);
}

/** Подкатегории без parentId вешаем на родителя (с учётом вложенности) */
export function foldCategoriesIntoRoots(categories: Category[]): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const byName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  return categories.map((cat) => {
    if (ROOT_IDS.has(cat.id)) {
      return cat.parentId ? { ...cat, parentId: undefined } : cat;
    }

    if (cat.parentId && byId.has(cat.parentId)) {
      return cat;
    }

    const parentId = resolveParentCategoryId(cat, byName);
    if (parentId && parentId !== cat.id) {
      return { ...cat, parentId };
    }

    return cat;
  });
}

export function repairCategoryTree(categories: Category[]): Category[] {
  const folded = foldCategoriesIntoRoots(categories);
  const byId = new Map(folded.map((c) => [c.id, c]));
  const byName = new Map(folded.map((c) => [c.name.toLowerCase(), c]));

  return folded.map((cat) => {
    if (ROOT_IDS.has(cat.id)) {
      return cat.parentId ? { ...cat, parentId: undefined } : cat;
    }

    let parentId = resolveParentCategoryId(cat, byName) ?? cat.parentId;
    if (parentId && !byId.has(parentId)) {
      parentId = resolveParentId(cat.name) ?? undefined;
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
  const mergedDefaults = mergeDefaultCategoryIds(categories);
  const idRemap = mergedDefaults.idRemap;
  const workingProducts = products.map((p) => ({ ...p }));
  remapProductCategoryIds(workingProducts, idRemap);

  const catMap = new Map(mergedDefaults.categories.map((c) => [c.id, c]));
  const categoryStore: CategoryMap = new Map(mergedDefaults.categories.map((c) => [c.id, c]));

  const ensureCat = (name: string, sheetHint?: string): string =>
    upsertCategory(name, categoryStore, sheetHint);

  const repairedProducts = workingProducts.map((p) => {
    const current = catMap.get(p.categoryId) ?? categoryStore.get(p.categoryId);
    if (!current) return p;

    if (ROOT_IDS.has(p.categoryId)) {
      const sheet = isParentSheet(current.name) ? current.name : current.name;
      const inferred = inferCategoryFromProduct(p.name, sheet, p.description);
      if (inferred) {
        const newId = ensureCat(inferred, sheet);
        if (newId !== p.categoryId) return { ...p, categoryId: newId };
      }
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

    // Компрессионные из раздела полипропилен → комплектующие
    if (isInCategoryTree([...categoryStore.values()], p.categoryId, 'polipropilen')) {
      if (
        isCompressionProduct(p.name, p.description, current.name) ||
        /компрессион/i.test(current.name)
      ) {
        const newId = ensureCat(COMPRESSION_CATEGORY, 'Комплектующие');
        if (newId !== p.categoryId) return { ...p, categoryId: newId };
      }
    }

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

  let withNestedCombined = repairedProducts.map((p) => {
    const cat = categoryStore.get(p.categoryId);
    if (!cat) return p;
    const inCombinedBucket =
      cat.id === 'kombinirovannye-fitingi' || cat.name === COMBINED_FITTINGS;
    if (!inCombinedBucket) return p;

    const subType = inferCombinedFittingSubType(p.name);
    if (!subType) return p;

    const newId = ensureCat(subType, 'Полипропилен');
    return newId !== p.categoryId ? { ...p, categoryId: newId } : p;
  });

  const reparentedCategories = repairCategoryTree([...categoryStore.values()]).map((cat) => {
    if (/компрессион/i.test(cat.name) && cat.parentId === 'polipropilen') {
      return { ...cat, parentId: 'komplektuyushchie' };
    }
    return cat;
  });

  return {
    products: withNestedCombined,
    categories: pruneEmptyCategories(reparentedCategories, withNestedCombined),
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
