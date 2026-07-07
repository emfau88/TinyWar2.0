import type { LaneName } from "../map/pathfinding";

export type PlayerDirection = "Any" | "Top" | "TopMid" | "Mid" | "MidBot" | "Bot" | "TopBot";

export const PLAYER_DIRECTION_ORDER: readonly PlayerDirection[] = [
  "Any",
  "Top",
  "TopMid",
  "Mid",
  "MidBot",
  "Bot",
  "TopBot"
];

export function nextDirection(direction: PlayerDirection): PlayerDirection {
  const index = PLAYER_DIRECTION_ORDER.indexOf(direction);
  return PLAYER_DIRECTION_ORDER[(index + 1) % PLAYER_DIRECTION_ORDER.length];
}

export function previousDirection(direction: PlayerDirection): PlayerDirection {
  const index = PLAYER_DIRECTION_ORDER.indexOf(direction);
  return PLAYER_DIRECTION_ORDER[
    (index - 1 + PLAYER_DIRECTION_ORDER.length) % PLAYER_DIRECTION_ORDER.length
  ];
}

export function randomLaneForDirection(
  direction: PlayerDirection,
  random = Math.random,
  availableLanes?: readonly LaneName[]
): LaneName {
  const directionLanes = lanesForDirection(direction);
  const lanes = availableLanes
    ? directionLanes.filter((lane) => availableLanes.includes(lane))
    : directionLanes;
  if (lanes.length === 0) {
    return availableLanes?.[0] ?? directionLanes[0];
  }

  return lanes[Math.min(lanes.length - 1, Math.floor(random() * lanes.length))];
}

export function lanesForDirection(direction: PlayerDirection): readonly LaneName[] {
  switch (direction) {
    case "Any":
      return ["Top", "Mid", "Bot"];
    case "Top":
      return ["Top"];
    case "TopMid":
      return ["Top", "Mid"];
    case "Mid":
      return ["Mid"];
    case "MidBot":
      return ["Mid", "Bot"];
    case "Bot":
      return ["Bot"];
    case "TopBot":
      return ["Top", "Bot"];
  }
}
