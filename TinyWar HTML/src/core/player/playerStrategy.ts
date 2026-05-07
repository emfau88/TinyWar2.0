export type PlayerStrategy = "Attack" | "Guard" | "March" | "Berserk";

export const PLAYER_STRATEGIES: readonly PlayerStrategy[] = ["Attack", "Guard", "March", "Berserk"];
export const STRATEGY_COOLDOWN_MS = 5000;

export interface StrategyState {
  readonly current: PlayerStrategy;
  readonly remainingCooldownMs: number;
}

export function createStrategyState(): StrategyState {
  return {
    current: "Attack",
    remainingCooldownMs: 0
  };
}

export function tickStrategyCooldown(state: StrategyState, deltaMs: number): StrategyState {
  if (state.remainingCooldownMs <= 0) {
    return state;
  }

  return {
    ...state,
    remainingCooldownMs: Math.max(0, state.remainingCooldownMs - deltaMs)
  };
}

export function selectStrategy(
  state: StrategyState,
  strategy: PlayerStrategy
): { state: StrategyState; changed: boolean } {
  if (state.current === strategy || state.remainingCooldownMs > 0) {
    return { state, changed: false };
  }

  return {
    state: {
      current: strategy,
      remainingCooldownMs: STRATEGY_COOLDOWN_MS
    },
    changed: true
  };
}

export function strategyHotkey(strategy: PlayerStrategy): string {
  return {
    Attack: "T",
    Guard: "Y",
    March: "U",
    Berserk: "I"
  }[strategy];
}
