import { Link } from 'react-router-dom';
import type { Category } from '../data/categories';
import { getRootCategoryId } from '../lib/catalog';

type Props = {
  parentId: string;
  depth: number;
  categorySlug?: string;
  expandedIds: Set<string>;
  rootId: string;
  getSubcategories: (parentId: string) => Category[];
  onToggleExpand: (id: string) => void;
};

export function CatalogCategoryBranch({
  parentId,
  depth,
  categorySlug,
  expandedIds,
  rootId,
  getSubcategories,
  onToggleExpand,
}: Props) {
  const subs = getSubcategories(parentId);
  if (!subs.length) return null;

  return (
    <ul className="cat-sublist" data-depth={depth}>
      {subs.map((sub) => {
        const children = getSubcategories(sub.id);
        const hasChildren = children.length > 0;
        const isOpen = expandedIds.has(sub.id);

        return (
          <li key={sub.id} className={isOpen ? 'cat-item-expanded' : ''}>
            <Link
              to={`/catalog/${sub.slug}`}
              className={`sub ${categorySlug === sub.slug ? 'active' : ''}`}
              style={{ paddingLeft: `${0.75 + depth * 0.65}rem` }}
              onClick={() => {
                if (hasChildren) onToggleExpand(sub.id);
                onToggleExpand(rootId);
              }}
            >
              {sub.name}
            </Link>
            {isOpen && hasChildren && (
              <CatalogCategoryBranch
                parentId={sub.id}
                depth={depth + 1}
                categorySlug={categorySlug}
                expandedIds={expandedIds}
                rootId={rootId}
                getSubcategories={getSubcategories}
                onToggleExpand={onToggleExpand}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function isCategoryUnderRoot(
  categories: Category[],
  active: Category | undefined,
  rootId: string,
): boolean {
  if (!active) return false;
  if (active.id === rootId) return true;
  try {
    return getRootCategoryId(categories, active.id) === rootId;
  } catch {
    return false;
  }
}
