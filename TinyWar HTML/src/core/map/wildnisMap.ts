import {
  WILDNIS_LAIR_ANCHOR,
  WILDNIS_LAIR_DOOR,
  WILDNIS_LANE_WAYPOINTS,
  WILDNIS_PLAYER_BASE_ANCHOR,
  WILDNIS_PLAYER_DOOR,
  WILDNIS_PLAYER_ROOF,
  WILDNIS_SIZE,
  WILDNIS_WALKABLE
} from "./generated/wildnisMapLayout";
import type { MapDefinition } from "./mapDefinition";

export const WILDNIS_MAP: MapDefinition = {
  id: "wildnis",
  size: WILDNIS_SIZE,
  walkable: WILDNIS_WALKABLE,
  lanes: {
    Mid: WILDNIS_LANE_WAYPOINTS
  },
  availableLanes: ["Mid"],
  start: WILDNIS_PLAYER_DOOR,
  end: WILDNIS_LAIR_DOOR,
  bases: {
    player: {
      building: "Barracks",
      color: "Blue",
      anchor: WILDNIS_PLAYER_BASE_ANCHOR,
      door: WILDNIS_PLAYER_DOOR,
      roofDefenders: [WILDNIS_PLAYER_ROOF, WILDNIS_PLAYER_ROOF]
    },
    opponent: {
      building: "Castle",
      color: "Black",
      anchor: WILDNIS_LAIR_ANCHOR,
      door: WILDNIS_LAIR_DOOR,
      roofDefenders: []
    }
  }
};
