import { InventoryItem } from '../types';

const WEAPON_TYPES = new Set([
  'weapon',
  '武器',
  '兵器',
  '主手',
  '副手'
]);

const ARMOR_TYPES = new Set([
  'armor',
  '防具',
  '护甲',
  '盔甲',
  '饰品'
]);

const CONSUMABLE_TYPES = new Set([
  'consumable',
  '消耗品',
  '药剂',
  '道具',
  '补给'
]);

const MATERIAL_TYPES = new Set([
  'material',
  '材料',
  '素材'
]);

const KEY_TYPES = new Set([
  'key_item',
  '关键',
  '关键物品',
  '钥匙',
  '钥匙物品'
]);

const LOOT_TYPES = new Set([
  'loot',
  '战利品',
  '掉落'
]);

const QUALITY_MAP: Record<string, 'Broken' | 'Common' | 'Rare' | 'Epic' | 'Legendary'> = {
  Broken: 'Broken',
  Common: 'Common',
  Rare: 'Rare',
  Epic: 'Epic',
  Legendary: 'Legendary',
  破损: 'Broken',
  损坏: 'Broken',
  普通: 'Common',
  常见: 'Common',
  精良: 'Rare',
  稀有: 'Rare',
  史诗: 'Epic',
  传说: 'Legendary',
  神话: 'Legendary'
};

export const normalizeQuality = (quality?: string): 'Broken' | 'Common' | 'Rare' | 'Epic' | 'Legendary' => {
  if (!quality) return 'Common';
  return QUALITY_MAP[quality] || 'Common';
};

export const getQualityLabel = (quality?: string): string => {
  const normalized = normalizeQuality(quality);
  switch (normalized) {
    case 'Legendary': return '传说';
    case 'Epic': return '史诗';
    case 'Rare': return '稀有';
    case 'Broken': return '破损';
    case 'Common':
    default:
      return '普通';
  }
};

export const getTypeLabel = (type?: string): string => {
  if (!type) return '未知';
  const normalized = type.toLowerCase();
  if (WEAPON_TYPES.has(type) || WEAPON_TYPES.has(normalized)) return '武器';
  if (ARMOR_TYPES.has(type) || ARMOR_TYPES.has(normalized)) return '防具';
  if (CONSUMABLE_TYPES.has(type) || CONSUMABLE_TYPES.has(normalized)) return '消耗品';
  if (MATERIAL_TYPES.has(type) || MATERIAL_TYPES.has(normalized)) return '材料';
  if (KEY_TYPES.has(type) || KEY_TYPES.has(normalized)) return '关键物品';
  if (LOOT_TYPES.has(type) || LOOT_TYPES.has(normalized)) return '战利品';
  return type;
};

export type ItemCategory = 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'MATERIAL' | 'KEY_ITEM' | 'LOOT' | 'OTHER';

export const getItemCategory = (item: InventoryItem): ItemCategory => {
  if (isWeaponItem(item)) return 'WEAPON';
  if (isArmorItem(item)) return 'ARMOR';
  const raw = item.类型;
  const normalized = typeof raw === 'string' ? raw.toLowerCase() : raw;
  const matches = (set: Set<string>) => (raw && set.has(raw)) || (typeof normalized === 'string' && set.has(normalized));
  if (matches(CONSUMABLE_TYPES)) return 'CONSUMABLE';
  if (matches(MATERIAL_TYPES)) return 'MATERIAL';
  if (matches(KEY_TYPES)) return 'KEY_ITEM';
  if (matches(LOOT_TYPES)) return 'LOOT';
  return 'OTHER';
};

export const isWeaponItem = (item: InventoryItem): boolean => {
  if (!item) return false;
  if (item.武器) return true;
  if (!item.类型) return false;
  const raw = item.类型;
  const normalized = typeof raw === 'string' ? raw.toLowerCase() : raw;
  return WEAPON_TYPES.has(raw) || (typeof normalized === 'string' && WEAPON_TYPES.has(normalized));
};

export const isArmorItem = (item: InventoryItem): boolean => {
  if (!item) return false;
  if (item.防具) return true;
  if (!item.类型) return false;
  const raw = item.类型;
  const normalized = typeof raw === 'string' ? raw.toLowerCase() : raw;
  return ARMOR_TYPES.has(raw) || (typeof normalized === 'string' && ARMOR_TYPES.has(normalized));
};

export const getDefaultEquipSlot = (item: InventoryItem): string => {
  if (!item) return '';
  if (item.装备槽位) return item.装备槽位;
  if (isWeaponItem(item)) return '主手';
  if (isArmorItem(item)) return '身体';
  return '';
};

export const ensureTypeTag = (item: InventoryItem, category: ItemCategory): InventoryItem => {
  if (!item) return item;
  if (item.类型) return item;
  const type = category === 'WEAPON'
    ? 'weapon'
    : category === 'ARMOR'
      ? 'armor'
      : category === 'CONSUMABLE'
        ? 'consumable'
        : category === 'MATERIAL'
          ? 'material'
          : category === 'KEY_ITEM'
            ? 'key_item'
            : category === 'LOOT'
              ? 'loot'
              : 'loot';
  return { ...item, 类型: type };
};
