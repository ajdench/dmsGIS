export interface ParCorrectionPolicy {
  baseValue: number;
  contextBaseLabel: string;
}

export const DEFAULT_PAR_CORRECTION_POLICY: ParCorrectionPolicy = {
  baseValue: 8500,
  contextBaseLabel: '8500',
};
