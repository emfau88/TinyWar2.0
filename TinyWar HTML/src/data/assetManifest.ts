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
