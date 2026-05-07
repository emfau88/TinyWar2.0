const ROOT = "/assets/tinywar";

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
    }
  }
} as const;
