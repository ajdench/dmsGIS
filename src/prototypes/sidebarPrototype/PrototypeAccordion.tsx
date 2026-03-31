import * as Accordion from '@radix-ui/react-accordion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import {
  PrototypeDragHandle,
  PrototypeMetricPill,
  PrototypeToggleButton,
  type PrototypeToggleState,
  type SwatchStop,
} from './PrototypeControls';

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
  badgeSwatchOpacity?: number;
  badgeSwatchMix?: SwatchStop[];
  badgeSwatchBorderColor?: string;
  badgeSwatchBorderWidth?: number;
  badgeSwatchBorderOpacity?: number;
  children: ReactNode;
  level?: 'pane' | 'subpane';
  panel?: boolean;
  enabled?: boolean;
  toggleState?: PrototypeToggleState;
  onEnabledToggle?: () => void;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: (element: HTMLButtonElement | null) => void;
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

export function PrototypeChevronDownIcon({
  className,
}: {
  className?: string;
}) {
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

export function PrototypeAccordionItem({
  id,
  title,
  subtitle,
  badge,
  badgeSwatch,
  badgeSwatchOpacity,
  badgeSwatchMix,
  badgeSwatchBorderColor,
  badgeSwatchBorderWidth,
  badgeSwatchBorderOpacity,
  children,
  level = 'pane',
  panel = false,
  enabled,
  toggleState,
  onEnabledToggle,
  dragHandleProps,
  dragHandleRef,
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
          {level === 'pane' ? (
            <>
              <span className="prototype-accordion-item__pane-main-slot">
                {typeof enabled === 'boolean' ? (
                  <PrototypeToggleButton
                    enabled={enabled}
                    state={toggleState}
                    onClick={onEnabledToggle}
                  />
                ) : badge ? (
                  <PrototypeMetricPill
                    value={badge}
                    swatch={badgeSwatch}
                    swatchOpacity={badgeSwatchOpacity}
                    swatchMix={badgeSwatchMix}
                    swatchBorderColor={badgeSwatchBorderColor}
                    swatchBorderWidth={badgeSwatchBorderWidth}
                    swatchBorderOpacity={badgeSwatchBorderOpacity}
                  />
                ) : null}
              </span>
              <Accordion.Trigger className="prototype-disclosure-button prototype-disclosure-button--pane">
                <PrototypeChevronDownIcon className="prototype-accordion-item__chevron" />
              </Accordion.Trigger>
              <PrototypeDragHandle
                ref={dragHandleRef}
                className="prototype-drag-handle--pane"
                label={title}
                {...dragHandleProps}
              />
            </>
          ) : (
            <span className="prototype-accordion-item__meta">
              {typeof enabled === 'boolean' ? (
                <PrototypeToggleButton
                  enabled={enabled}
                  state={toggleState}
                  onClick={onEnabledToggle}
                />
              ) : null}
              {badge ? (
                <PrototypeMetricPill
                  value={badge}
                  swatch={badgeSwatch}
                  swatchOpacity={badgeSwatchOpacity}
                  swatchMix={badgeSwatchMix}
                  swatchBorderColor={badgeSwatchBorderColor}
                  swatchBorderWidth={badgeSwatchBorderWidth}
                  swatchBorderOpacity={badgeSwatchBorderOpacity}
                />
              ) : null}
              <Accordion.Trigger className="prototype-disclosure-button">
                <PrototypeChevronDownIcon className="prototype-accordion-item__chevron" />
              </Accordion.Trigger>
            </span>
          )}
        </div>
      </Accordion.Header>
      <Accordion.Content className="prototype-accordion-item__content">
        {children}
      </Accordion.Content>
    </Accordion.Item>
  );
}
