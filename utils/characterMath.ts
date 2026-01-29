import { CharacterStats, InventoryItem } from '../types';

export const computeInventoryWeight = (items: InventoryItem[]): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const weight = typeof item.重量 === 'number' ? item.重量 : 0;
    const qty = typeof item.数量 === 'number' ? item.数量 : 1;
    return sum + weight * qty;
  }, 0);
};

export const computeMaxCarry = (stats: CharacterStats): number => {
  const level = Math.max(1, stats?.等级 || 1);
  const str = Math.max(0, stats?.能力值?.力量 || 0);
  const end = Math.max(0, stats?.能力值?.耐久 || 0);
  const dex = Math.max(0, stats?.能力值?.灵巧 || 0);

  // 基础负重 40kg + 等级增益 + 力量/耐久/灵巧贡献
  const base = 40;
  const levelBonus = level * 10;
  const strBonus = str * 0.18;
  const endBonus = end * 0.12;
  const dexBonus = dex * 0.06;

  return Math.round((base + levelBonus + strBonus + endBonus + dexBonus) * 10) / 10;
};
