export interface DamageStats {
  physicalDamage: number;
  magicDamage: number;
  armor: number;
  magicResist: number;
  armorPen: number;
  magicPen: number;
}

export function calculateDamage(attacker: DamageStats, defender: DamageStats): number {
  const effectiveArmor = Math.max(0, defender.armor - attacker.armorPen);
  const effectiveMagicResist = Math.max(0, defender.magicResist - attacker.magicPen);
  const physicalDamage = attacker.physicalDamage * (10 / (10 + effectiveArmor));
  const magicDamage = attacker.magicDamage * (10 / (10 + effectiveMagicResist));

  return Math.max(5, physicalDamage + magicDamage);
}
