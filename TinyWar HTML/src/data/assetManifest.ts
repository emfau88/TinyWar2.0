import { MONSTER_UNITS } from "../core/units/unitData";
import { CORE_BOOST_NAMES, type BoostName } from "../core/boosts/boostData";

// Relative to the page URL so the game also works under a sub-path deploy
// (e.g. GitHub Pages at /TinyWar-HTML/).
const ROOT = "assets/tinywar";

// Boost artwork files use the original's naming: camel case split into
// lowercase words ("QueueGoblins" -> "queue goblins").
function boostArtFileName(name: BoostName): string {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

export const ASSETS = {
  background: {
    cover: {
      key: "bg-cover",
      path: `${ROOT}/images/bg/cover.png`
    },
    scenery1: {
      key: "bg-scenery-1",
      path: `${ROOT}/images/bg/scenery1.png`
    }
  },
  ui: {
    banner: {
      key: "ui-banner",
      path: `${ROOT}/images/ui/banner.png`
    },
    largeRibbons: {
      key: "ui-large-ribbons",
      path: `${ROOT}/images/ui/large ribbons.png`
    },
    smallRibbons: {
      key: "ui-small-ribbons",
      path: `${ROOT}/images/ui/small ribbons.png`
    },
    swords1: {
      key: "ui-swords-1",
      path: `${ROOT}/images/ui/swords1.png`
    },
    swords2: {
      key: "ui-swords-2",
      path: `${ROOT}/images/ui/swords2.png`
    },
    swords3: {
      key: "ui-swords-3",
      path: `${ROOT}/images/ui/swords3.png`
    }
  },
  icons: {
    anyArrow: {
      key: "icon-any-arrow",
      path: `${ROOT}/images/icons/any arrow.png`
    },
    topArrow: {
      key: "icon-top-arrow",
      path: `${ROOT}/images/icons/top arrow.png`
    },
    topMidArrow: {
      key: "icon-top-mid-arrow",
      path: `${ROOT}/images/icons/top-mid arrow.png`
    },
    midArrow: {
      key: "icon-mid-arrow",
      path: `${ROOT}/images/icons/mid arrow.png`
    },
    topBotArrow: {
      key: "icon-top-bot-arrow",
      path: `${ROOT}/images/icons/top bot arrow.png`
    },
    attack: {
      key: "icon-attack",
      path: `${ROOT}/images/icons/attack.png`
    },
    guard: {
      key: "icon-guard",
      path: `${ROOT}/images/icons/guard.png`
    },
    march: {
      key: "icon-march",
      path: `${ROOT}/images/icons/march.png`
    },
    berserk: {
      key: "icon-berserk",
      path: `${ROOT}/images/icons/berserk.png`
    },
    sound: {
      key: "icon-sound",
      path: `${ROOT}/images/icons/sound.png`
    },
    mute: {
      key: "icon-mute",
      path: `${ROOT}/images/icons/mute.png`
    }
  },
  buildings: {
    blueBarracks: {
      key: "building-blue-barracks",
      path: `${ROOT}/images/buildings/Blue/Barracks.png`
    },
    redBarracks: {
      key: "building-red-barracks",
      path: `${ROOT}/images/buildings/Red/Barracks.png`
    },
    blackCastle: {
      key: "building-black-castle",
      path: `${ROOT}/images/buildings/Black/Castle.png`
    },
    blueTower: {
      key: "building-blue-tower",
      path: `${ROOT}/images/buildings/Blue/Tower.png`
    },
    redTower: {
      key: "building-red-tower",
      path: `${ROOT}/images/buildings/Red/Tower.png`
    }
  },
  units: {
    blueWarrior: {
      key: "unit-blue-warrior",
      path: `${ROOT}/images/units/Blue/Warrior.png`
    },
    blueLancer: {
      key: "unit-blue-lancer",
      path: `${ROOT}/images/units/Blue/Lancer.png`
    },
    blueArcher: {
      key: "unit-blue-archer",
      path: `${ROOT}/images/units/Blue/Archer.png`
    },
    bluePriest: {
      key: "unit-blue-priest",
      path: `${ROOT}/images/units/Blue/Priest.png`
    },
    redWarrior: {
      key: "unit-red-warrior",
      path: `${ROOT}/images/units/Red/Warrior.png`
    },
    redLancer: {
      key: "unit-red-lancer",
      path: `${ROOT}/images/units/Red/Lancer.png`
    },
    redArcher: {
      key: "unit-red-archer",
      path: `${ROOT}/images/units/Red/Archer.png`
    },
    redPriest: {
      key: "unit-red-priest",
      path: `${ROOT}/images/units/Red/Priest.png`
    }
  },
  projectiles: {
    arrow: {
      key: "projectile-arrow",
      path: `${ROOT}/images/units/arrow.png`
    },
    // Bone and magic are animated sheets (spinning bone, pulsing orb); the
    // harpoon is a single frame like the arrow.
    bone: {
      key: "projectile-bone",
      path: `${ROOT}/images/units/bone.png`,
      frameSize: 64,
      frames: 4
    },
    magic: {
      key: "projectile-magic",
      path: `${ROOT}/images/units/magic.png`,
      frameSize: 128,
      frames: 3
    },
    harpoon: {
      key: "projectile-harpoon",
      path: `${ROOT}/images/units/harpoon.png`
    }
  },
  boostCards: {
    frame: {
      key: "boost-card-frame",
      path: `${ROOT}/images/boosts/boost.png`
    },
    // Downscaled JPEG copies of the original card artworks (the source PNGs
    // are ~1.7MB each - far too heavy to preload on mobile).
    art: CORE_BOOST_NAMES.reduce(
      (art, name) => ({
        ...art,
        [name]: {
          key: `boost-art-${boostArtFileName(name).replace(/ /g, "-")}`,
          path: `${ROOT}/images/boosts/small/${boostArtFileName(name)}.jpg`
        }
      }),
      {} as Record<BoostName, { key: string; path: string }>
    )
  },
  effects: {
    // Looping flames for damaged buildings (three variants) and the one-shot
    // building explosion, straight from the original's effect sheets.
    fires: [
      { key: "effect-fire-1", path: `${ROOT}/images/effects/fire1.png`, frameSize: 64, frames: 8 },
      { key: "effect-fire-2", path: `${ROOT}/images/effects/fire2.png`, frameSize: 64, frames: 10 },
      { key: "effect-fire-3", path: `${ROOT}/images/effects/fire3.png`, frameSize: 64, frames: 12 }
    ],
    explosions: [
      { key: "effect-explosion-1", path: `${ROOT}/images/effects/explosion1.png`, frameSize: 192, frames: 9 },
      { key: "effect-explosion-2", path: `${ROOT}/images/effects/explosion2.png`, frameSize: 192, frames: 11 }
    ]
  },
  monsterPortraits: MONSTER_UNITS.reduce(
    (portraits, name) => ({
      ...portraits,
      [name]: {
        key: `unit-monster-${name.toLowerCase()}-portrait`,
        path: `${ROOT}/images/units/Monsters/${name}/${name}.png`
      }
    }),
    {} as Record<(typeof MONSTER_UNITS)[number], { key: string; path: string }>
  ),
  audio: {
    button: {
      key: "audio-button",
      path: `${ROOT}/audio/button.ogg`
    },
    click: {
      key: "audio-click",
      path: `${ROOT}/audio/click.ogg`
    },
    error: {
      key: "audio-error",
      path: `${ROOT}/audio/error.ogg`
    },
    explosion: {
      key: "audio-explosion",
      path: `${ROOT}/audio/explosion.ogg`
    },
    victory: {
      key: "audio-victory",
      path: `${ROOT}/audio/victory.ogg`
    },
    music: {
      key: "audio-music",
      path: `${ROOT}/audio/music.ogg`
    },
    defeat: {
      key: "audio-defeat",
      path: `${ROOT}/audio/defeat.ogg`
    },
    horn: {
      key: "audio-horn",
      path: `${ROOT}/audio/horn.ogg`
    },
    message: {
      key: "audio-message",
      path: `${ROOT}/audio/message.ogg`
    },
    warning: {
      key: "audio-warning",
      path: `${ROOT}/audio/warning.ogg`
    }
  }
} as const;
