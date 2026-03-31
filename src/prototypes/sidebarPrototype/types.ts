import type { ReactNode } from 'react';

export interface PrototypeSection {
  id: string;
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface PrototypePane {
  id: string;
  title: string;
  subtitle?: string;
  sections: PrototypeSection[];
}
