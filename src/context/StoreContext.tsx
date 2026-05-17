import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Category } from '../data/categories';
import { defaultCategories } from '../data/categories';
import type { Product } from '../data/products';
import { defaultProducts } from '../data/products';
import { DEFAULT_SITE, type SiteConfig } from '../config';
import * as catalog from '../lib/catalog';
import { repairCategoryTree, repairProductCategories } from '../lib/categoryAssign';
import { deduplicateProducts } from '../lib/productDedupe';
import { toIdbImageRef } from '../lib/productImageStore';

function applyCatalogRepair(
  products: Product[],
  categories: Category[],
): { products: Product[]; categories: Category[] } {
  const { products: fixedProducts, categories: fixedCats } = repairProductCategories(
    products,
    categories,
  );
  return {
    products: deduplicateProducts(fixedProducts),
    categories: repairCategoryTree(fixedCats),
  };
}

const KEYS = {
  products: 'akvasnab-products',
  categories: 'akvasnab-categories',
  site: 'akvasnab-site',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

interface StoreContextValue {
  products: Product[];
  categories: Category[];
  site: SiteConfig;
  mainCategories: Category[];
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  searchProducts: (query: string) => Product[];
  getCategoryBySlug: (slug: string) => Category | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getSubcategories: (parentId: string) => Category[];
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (id: string) => boolean;
  updateSite: (site: SiteConfig) => void;
  resetToDefaults: () => void;
  importCatalog: (
    data: { products: Product[]; categories?: Category[] },
    mode: 'replace' | 'merge',
  ) => void;
  /** Убрать перечёркнутую «старую» цену у всех товаров */
  clearStrikethroughPrices: () => void;
  repairCatalog: () => void;
  /** Привязать idb:артикул к товарам после восстановления фото */
  applyProductImageRefs: (articles: string[]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = load(KEYS.products, defaultProducts);
    const cats = load(KEYS.categories, defaultCategories);
    return applyCatalogRepair(loaded, cats).products;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const loaded = load(KEYS.categories, defaultCategories);
    const prods = load(KEYS.products, defaultProducts);
    return applyCatalogRepair(prods, loaded).categories;
  });
  const [site, setSite] = useState<SiteConfig>(() => load(KEYS.site, DEFAULT_SITE));

  useEffect(() => save(KEYS.products, products), [products]);
  useEffect(() => save(KEYS.categories, categories), [categories]);
  useEffect(() => save(KEYS.site, site), [site]);

  const mainCategories = useMemo(
    () => catalog.getMainCategories(categories),
    [categories],
  );

  const getProductBySlug = useCallback(
    (slug: string) => catalog.getProductBySlug(products, slug),
    [products],
  );
  const getProductById = useCallback(
    (id: string) => catalog.getProductById(products, id),
    [products],
  );
  const getProductsByCategory = useCallback(
    (categoryId: string) => catalog.getProductsByCategory(products, categories, categoryId),
    [products, categories],
  );
  const searchProducts = useCallback(
    (query: string) => catalog.searchProducts(products, query),
    [products],
  );
  const getCategoryBySlug = useCallback(
    (slug: string) => catalog.getCategoryBySlug(categories, slug),
    [categories],
  );
  const getCategoryById = useCallback(
    (id: string) => catalog.getCategoryById(categories, id),
    [categories],
  );
  const getSubcategories = useCallback(
    (parentId: string) => catalog.getSubcategories(categories, parentId),
    [categories],
  );

  const saveProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      const i = prev.findIndex((p) => p.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = product;
        return next;
      }
      return [...prev, product];
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const saveCategory = useCallback((category: Category) => {
    setCategories((prev) => {
      const i = prev.findIndex((c) => c.id === category.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = category;
        return next;
      }
      return [...prev, category];
    });
  }, []);

  const deleteCategory = useCallback(
    (id: string): boolean => {
      const hasChildren = categories.some((c) => c.parentId === id);
      const hasProducts = products.some((p) => p.categoryId === id);
      if (hasChildren || hasProducts) return false;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    },
    [categories, products],
  );

  const updateSite = useCallback((next: SiteConfig) => setSite(next), []);

  const resetToDefaults = useCallback(() => {
    setProducts(defaultProducts);
    setCategories(defaultCategories);
    setSite(DEFAULT_SITE);
  }, []);

  const repairCatalog = useCallback(() => {
    setCategories((prevCats) => {
      setProducts((prevProducts) => {
        const repaired = applyCatalogRepair(prevProducts, prevCats);
        setCategories(repaired.categories);
        return repaired.products;
      });
      return prevCats;
    });
  }, []);

  const applyProductImageRefs = useCallback((articles: string[]) => {
    const set = new Set(articles);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.article && set.has(p.article)) {
          return { ...p, image: toIdbImageRef(p.article) };
        }
        return p;
      }),
    );
  }, []);

  const clearStrikethroughPrices = useCallback(() => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.oldPrice == null) return p;
        const { oldPrice: _, ...rest } = p;
        return rest;
      }),
    );
  }, []);

  const importCatalog = useCallback(
    (data: { products: Product[]; categories?: Category[] }, mode: 'replace' | 'merge') => {
      setCategories((prevCats) => {
        setProducts((prevProducts) => {
          const mergedProducts =
            mode === 'replace'
              ? deduplicateProducts(data.products)
              : deduplicateProducts([...prevProducts, ...data.products]);

          const mergedCats =
            mode === 'replace' && data.categories
              ? data.categories
              : (() => {
                  const map = new Map(prevCats.map((c) => [c.id, c]));
                  for (const c of data.categories ?? []) map.set(c.id, c);
                  return [...map.values()];
                })();

          const repaired = applyCatalogRepair(mergedProducts, mergedCats);
          setCategories(repaired.categories);
          return repaired.products;
        });
        return prevCats;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      site,
      mainCategories,
      getProductBySlug,
      getProductById,
      getProductsByCategory,
      searchProducts,
      getCategoryBySlug,
      getCategoryById,
      getSubcategories,
      saveProduct,
      deleteProduct,
      saveCategory,
      deleteCategory,
      updateSite,
      resetToDefaults,
      importCatalog,
      clearStrikethroughPrices,
      repairCatalog,
      applyProductImageRefs,
    }),
    [
      products,
      categories,
      site,
      mainCategories,
      getProductBySlug,
      getProductById,
      getProductsByCategory,
      searchProducts,
      getCategoryBySlug,
      getCategoryById,
      getSubcategories,
      saveProduct,
      deleteProduct,
      saveCategory,
      deleteCategory,
      updateSite,
      resetToDefaults,
      importCatalog,
      clearStrikethroughPrices,
      repairCatalog,
      applyProductImageRefs,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
