import type { UnitName } from "../units/unitData";

export const STARTING_GOLD = 120;
export const BASE_INCOME_PER_SEC = 10;

export const UNIT_COSTS: Record<UnitName, number> = {
  Warrior: 50,
  Lancer: 45,
  Archer: 55,
  Priest: 65
};

export interface GoldState {
  readonly gold: number;
  readonly incomeMultiplier: number;
}

export function createGoldState(incomeMultiplier = 1): GoldState {
  return {
    gold: STARTING_GOLD,
    incomeMultiplier
  };
}

export function tickGold(state: GoldState, deltaMs: number): GoldState {
  if (deltaMs <= 0) {
    return state;
  }

  return {
    ...state,
    gold: state.gold + (deltaMs / 1000) * BASE_INCOME_PER_SEC * state.incomeMultiplier
  };
}

export function canAfford(state: GoldState, unit: UnitName): boolean {
  return state.gold >= UNIT_COSTS[unit];
}

export function spendForUnit(state: GoldState, unit: UnitName): { state: GoldState; spent: boolean } {
  if (!canAfford(state, unit)) {
    return { state, spent: false };
  }

  return {
    state: {
      ...state,
      gold: state.gold - UNIT_COSTS[unit]
    },
    spent: true
  };
}

export function displayGold(state: GoldState): number {
  return Math.floor(state.gold);
}
