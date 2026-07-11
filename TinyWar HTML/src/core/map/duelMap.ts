import {
  DUEL_LANE_WAYPOINTS,
  DUEL_OPPONENT_BASE_ANCHOR,
  DUEL_OPPONENT_DOOR,
  DUEL_OPPONENT_ROOF,
  DUEL_PLAYER_BASE_ANCHOR,
  DUEL_PLAYER_DOOR,
  DUEL_PLAYER_ROOF,
  DUEL_SIZE,
  DUEL_STAIR_TOPS,
  DUEL_STAIR_WALLS,
  DUEL_WALKABLE
} from "./generated/duelMapLayout";
import type { MapDefinition } from "./mapDefinition";

// Classic rules on a single lane: two barracks on high plateaus, one
// S-shaped front over the mid ring and the sunken village arena.
export const DUEL_MAP: MapDefinition = {
  id: "duel",
  size: DUEL_SIZE,
  walkable: DUEL_WALKABLE,
  lanes: {
    Mid: DUEL_LANE_WAYPOINTS
  },
  availableLanes: ["Mid"],
  stairTops: DUEL_STAIR_TOPS,
  stairWalls: DUEL_STAIR_WALLS,
  start: DUEL_PLAYER_DOOR,
  end: DUEL_OPPONENT_DOOR,
  bases: {
    player: {
      building: "Barracks",
      color: "Blue",
      anchor: DUEL_PLAYER_BASE_ANCHOR,
      door: DUEL_PLAYER_DOOR,
      roofDefenders: [DUEL_PLAYER_ROOF, DUEL_PLAYER_ROOF]
    },
    opponent: {
      building: "Barracks",
      color: "Red",
      anchor: DUEL_OPPONENT_BASE_ANCHOR,
      door: DUEL_OPPONENT_DOOR,
      roofDefenders: [DUEL_OPPONENT_ROOF, DUEL_OPPONENT_ROOF]
    }
  }
};
