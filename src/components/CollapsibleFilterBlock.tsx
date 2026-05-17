import type { FocusEvent, ReactNode } from 'react';
import './CollapsibleFilterBlock.css';

interface CollapsibleFilterBlockProps {
  id: string;
  isOpen: boolean;
  canHover: boolean;
  bind: (id: string) => {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onFocusCapture?: () => void;
    onBlurCapture?: (e: FocusEvent<HTMLElement>) => void;
  };
  onToggle?: () => void;
  legend: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function CollapsibleFilterBlock({
  id,
  isOpen,
  canHover,
  bind,
  onToggle,
  legend,
  children,
  className = '',
  bodyClassName = '',
}: CollapsibleFilterBlockProps) {
  return (
    <fieldset
      className={`smart-filter-block smart-filter-collapsible ${isOpen ? 'is-expanded' : 'is-collapsed'} ${className}`.trim()}
      {...bind(id)}
    >
      <legend
        className="smart-filter-collapsible-legend"
        onClick={onToggle}
        onKeyDown={
          onToggle
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
        role={onToggle ? 'button' : undefined}
        tabIndex={onToggle ? 0 : undefined}
        aria-expanded={onToggle ? isOpen : undefined}
      >
        {legend}
        {canHover && !isOpen && (
          <span className="smart-filter-collapsible-hint">наведите</span>
        )}
        {!canHover && !isOpen && (
          <span className="smart-filter-collapsible-hint">развернуть</span>
        )}
      </legend>
      <div className={`smart-filter-collapsible-body ${bodyClassName}`.trim()}>{children}</div>
    </fieldset>
  );
}
