import { Link } from 'react-router-dom';
import type { Category } from '../data/categories';
import { isCategoryInTree } from '../lib/catalog';

type BranchProps = {
  parentId: string;
  depth: number;
  categories: Category[];
  activeCategory?: Category;
  expandedIds: Set<string>;
  getSubcategories: (parentId: string) => Category[];
  onToggleExpand: (id: string) => void;
  onCategorySelect?: () => void;
};

type TreeRowProps = {
  cat: Category;
  depth: number;
  hasChildren: boolean;
  isOpen: boolean;
  isActive: boolean;
  icon?: string;
  onToggleExpand: (id: string) => void;
  onCategorySelect?: () => void;
};

function CategoryTreeRow({
  cat,
  depth,
  hasChildren,
  isOpen,
  isActive,
  icon,
  onToggleExpand,
  onCategorySelect,
}: TreeRowProps) {
  return (
    <div
      className="cat-row"
      style={depth > 0 ? { paddingLeft: `${0.35 + depth * 0.65}rem` } : undefined}
    >
      {hasChildren ? (
        <button
          type="button"
          className="cat-toggle"
          aria-expanded={isOpen}
          aria-label={isOpen ? `Свернуть «${cat.name}»` : `Развернуть «${cat.name}»`}
          onClick={() => onToggleExpand(cat.id)}
        >
          <span className="cat-chevron" aria-hidden>
            {isOpen ? '▼' : '▶'}
          </span>
        </button>
      ) : (
        <span className="cat-toggle-spacer" aria-hidden />
      )}
      <Link
        to={`/catalog/${cat.slug}`}
        className={`cat-link ${depth > 0 ? 'sub' : ''} ${isActive ? 'active' : ''}`}
        onClick={onCategorySelect}
      >
        {icon != null && icon !== '' ? (
          <span className="cat-label">
            {icon} {cat.name}
          </span>
        ) : (
          <span className="cat-label">{cat.name}</span>
        )}
      </Link>
    </div>
  );
}

export function CatalogCategoryBranch({
  parentId,
  depth,
  categories,
  activeCategory,
  expandedIds,
  getSubcategories,
  onToggleExpand,
  onCategorySelect,
}: BranchProps) {
  const subs = getSubcategories(parentId);
  if (!subs.length) return null;

  return (
    <ul className="cat-sublist" data-depth={depth}>
      {subs.map((sub) => {
        const children = getSubcategories(sub.id);
        const hasChildren = children.length > 0;
        const isOpen = expandedIds.has(sub.id);
        const isActive = isCategoryInTree(categories, activeCategory, sub.id);

        return (
          <li key={sub.id} className={isOpen ? 'cat-item-expanded' : ''}>
            <CategoryTreeRow
              cat={sub}
              depth={depth + 1}
              hasChildren={hasChildren}
              isOpen={isOpen}
              isActive={isActive}
              onToggleExpand={onToggleExpand}
              onCategorySelect={onCategorySelect}
            />
            {isOpen && hasChildren && (
              <CatalogCategoryBranch
                parentId={sub.id}
                depth={depth + 1}
                categories={categories}
                activeCategory={activeCategory}
                expandedIds={expandedIds}
                getSubcategories={getSubcategories}
                onToggleExpand={onToggleExpand}
                onCategorySelect={onCategorySelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { CategoryTreeRow };
