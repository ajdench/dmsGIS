import * as Accordion from '@radix-ui/react-accordion';
import type { ReactNode } from 'react';
import { PrototypeMetricPill, PrototypeToggleButton } from './PrototypeControls';

interface PrototypeAccordionProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  children: ReactNode;
  level?: 'pane' | 'subpane';
}

interface PrototypeAccordionItemProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeSwatch?: string;
  children: ReactNode;
  level?: 'pane' | 'subpane';
  panel?: boolean;
  enabled?: boolean;
  onEnabledToggle?: () => void;
}

export function PrototypeAccordion({
  value,
  onValueChange,
  children,
  level = 'pane',
}: PrototypeAccordionProps) {
  return (
    <Accordion.Root
      type="multiple"
      value={value}
      onValueChange={onValueChange}
      className={`prototype-accordion prototype-accordion--${level}`}
    >
      {children}
    </Accordion.Root>
  );
}

export function PrototypeAccordionItem({
  id,
  title,
  subtitle,
  badge,
  badgeSwatch,
  children,
  level = 'pane',
  panel = false,
  enabled,
  onEnabledToggle,
}: PrototypeAccordionItemProps) {
  return (
    <Accordion.Item
      value={id}
      className={`prototype-accordion-item prototype-accordion-item--${level}${
        panel ? ' prototype-accordion-item--panel' : ''
      }`}
    >
      <Accordion.Header className="prototype-accordion-item__heading">
        <div className="prototype-accordion-item__header-bar">
          <span className="prototype-accordion-item__title-wrap">
            <span className="prototype-accordion-item__title">{title}</span>
            {subtitle ? (
              <span className="prototype-accordion-item__subtitle">
                {subtitle}
              </span>
            ) : null}
          </span>
          <span className="prototype-accordion-item__meta">
            {typeof enabled === 'boolean' ? (
              <PrototypeToggleButton enabled={enabled} onClick={onEnabledToggle} />
            ) : null}
            {badge ? (
              <PrototypeMetricPill value={badge} swatch={badgeSwatch} />
            ) : null}
            <Accordion.Trigger className="prototype-disclosure-button">
              <span className="prototype-accordion-item__chevron" aria-hidden="true">
                ▾
              </span>
            </Accordion.Trigger>
          </span>
        </div>
      </Accordion.Header>
      <Accordion.Content className="prototype-accordion-item__content">
        {children}
      </Accordion.Content>
    </Accordion.Item>
  );
}
