import type { PayModifier, RateType } from '../types';

export const NIGHT_DIFF_MULTIPLIER = 1.1;
export const HOLIDAY_MULTIPLIER = 1.3;
export const DOUBLE_MULTIPLIER = 2.0;

export function rateTypeMultiplier(rateType: RateType): number {
  return rateType === 'night' ? NIGHT_DIFF_MULTIPLIER : 1;
}

export function modifierMultiplier(modifier: PayModifier): number {
  switch (modifier) {
    case 'holiday':
      return HOLIDAY_MULTIPLIER;
    case 'double':
      return DOUBLE_MULTIPLIER;
    default:
      return 1;
  }
}

/** Combined multiplier applied to an hour of work for a given rate type + modifier. */
export function combinedMultiplier(rateType: RateType, modifier: PayModifier): number {
  return rateTypeMultiplier(rateType) * modifierMultiplier(modifier);
}

export const RATE_LEGEND = [
  { key: 'normal', label: 'Normal', description: 'Standard daytime rate', multiplier: 1 },
  { key: 'night', label: 'Night Differential', description: '+10% over base rate', multiplier: NIGHT_DIFF_MULTIPLIER },
  { key: 'holiday', label: 'Holiday', description: '+30% over base rate', multiplier: HOLIDAY_MULTIPLIER },
  { key: 'double', label: 'Double Pay', description: '2× base rate', multiplier: DOUBLE_MULTIPLIER },
] as const;
