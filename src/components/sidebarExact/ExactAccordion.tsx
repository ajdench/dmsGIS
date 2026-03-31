import * as Accordion from '@radix-ui/react-accordion';
import { ExactDragHandle } from './ExactDragHandle';
import { ExactMetricPill } from './ExactMetricPill';
import { ExactToggleButton } from './ExactToggleButton';
import type { ExactAccordionItemProps, ExactAccordionProps } from './types';

export function ExactAccordion({
  value,
  onValueChange,
  children,
  level = 'pane',
}: ExactAccordionProps) {
  return (
    <Accordion.Root
      type="multiple"
      value={value}
      onValueChange={onValueChange}
      className={`sidebar-exact-accordion sidebar-exact-accordion--${level}`}
    >
      {children}
    </Accordion.Root>
  );
}

export function ExactChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ExactAccordionItem({
  id,
  title,
  subtitle,
  badge,
  badgeSwatch,
  children,
  level = 'pane',
  panel = false,
  enabled,
  toggleState,
  onEnabledToggle,
  dragHandleProps,
  dragHandleRef,
}: ExactAccordionItemProps) {
  return (
    <Accordion.Item
      value={id}
      className={`sidebar-exact-accordion-item sidebar-exact-accordion-item--${level}${
        panel ? ' sidebar-exact-accordion-item--panel' : ''
      }`}
    >
      <Accordion.Header className="sidebar-exact-accordion-item__heading">
        <div className="sidebar-exact-accordion-item__header-bar">
          <span className="sidebar-exact-accordion-item__title-wrap">
            <span className="sidebar-exact-accordion-item__title">{title}</span>
            {subtitle ? (
              <span className="sidebar-exact-accordion-item__subtitle">
                {subtitle}
              </span>
            ) : null}
          </span>
          {level === 'pane' ? (
            <>
              <span className="sidebar-exact-accordion-item__pane-main-slot">
                {typeof enabled === 'boolean' ? (
                  <ExactToggleButton
                    enabled={enabled}
                    state={toggleState}
                    onClick={onEnabledToggle}
                  />
                ) : badge ? (
                  <ExactMetricPill value={badge} swatch={badgeSwatch} />
                ) : null}
              </span>
              <Accordion.Trigger className="sidebar-exact-disclosure sidebar-exact-disclosure--pane">
                <ExactChevronDownIcon className="sidebar-exact-accordion-item__chevron" />
              </Accordion.Trigger>
              <ExactDragHandle
                ref={dragHandleRef}
                className="sidebar-exact-drag-handle--pane"
                label={title}
                {...dragHandleProps}
              />
            </>
          ) : (
            <span className="sidebar-exact-accordion-item__meta">
              {typeof enabled === 'boolean' ? (
                <ExactToggleButton
                  enabled={enabled}
                  state={toggleState}
                  onClick={onEnabledToggle}
                />
              ) : null}
              {badge ? <ExactMetricPill value={badge} swatch={badgeSwatch} /> : null}
              <Accordion.Trigger className="sidebar-exact-disclosure">
                <ExactChevronDownIcon className="sidebar-exact-accordion-item__chevron" />
              </Accordion.Trigger>
            </span>
          )}
        </div>
      </Accordion.Header>
      <Accordion.Content className="sidebar-exact-accordion-item__content">
        {children}
      </Accordion.Content>
    </Accordion.Item>
  );
}
