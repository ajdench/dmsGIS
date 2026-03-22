import { forwardRef } from 'react';
import type { ExactDragHandleProps } from './types';

export const ExactDragHandle = forwardRef<HTMLButtonElement, ExactDragHandleProps>(
  function ExactDragHandle({ label, className, ...buttonProps }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={`sidebar-exact-drag-handle${className ? ` ${className}` : ''}`}
        aria-label={`Reorder ${label}`}
        {...buttonProps}
      >
        <span className="sidebar-exact-drag-handle__dots" aria-hidden="true">
          ⋮⋮
        </span>
      </button>
    );
  },
);
