import React, { useState, useMemo } from 'react';
import { Package, Sword, Shield, Box, Gem, ArrowRightCircle, LogOut, Beaker, Leaf } from 'lucide-react';
import { InventoryItem } from '../../types';
import { getItemCategory, getDefaultEquipSlot, getTypeLabel, getQualityLabel, normalizeQuality, isWeaponItem, isArmorItem } from '../../utils/itemUtils';

interface MobileInventoryViewProps {
  items: InventoryItem[];
  equipment: { [key: string]: string };
  onEquipItem: (item: InventoryItem) => void;
  onUnequipItem: (slotKey: string, itemName?: string, itemId?: string) => void;
  onUseItem: (item: InventoryItem) => void;
}

const DurabilityRing: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.max(0, Math.min(100, (current / safeMax) * 100));
  const deg = percent * 3.6;
  const color = percent < 25 ? '#ef4444' : percent < 60 ? '#f59e0b' : '#22c55e';
  return (
    <div
      className="relative w-7 h-7 rounded-full"
      style={{ background: `conic-gradient(${color} ${deg}deg, rgba(24,24,27,0.8) 0deg)` }}
    >
      <div className="absolute inset-[3px] rounded-full bg-black flex items-center justify-center text-[7px] font-mono text-zinc-200">
        {current}/{max}
      </div>
    </div>
  );
};

type DetailRow = { label: string; value: string };
type DetailSection = { title: string; rows: DetailRow[] };

const toText = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (Array.isArray(value)) {
    return value
      .map(v => (v === undefined || v === null ? '' : String(v)))
      .filter(v => v.trim().length > 0)
      .join(' / ');
  }
  const text = String(value);
  return text.trim().length > 0 ? text : '';
};

const pushRow = (rows: DetailRow[], label: string, value: unknown) => {
  const text = toText(value);
  if (text) rows.push({ label, value: text });
};

const buildItemDetailSections = (item: InventoryItem, qualityLabel: string): DetailSection[] => {
  const sections: DetailSection[] = [];

  const baseRows: DetailRow[] = [];
  pushRow(baseRows, '类型', getTypeLabel(item.类型));
  pushRow(baseRows, '品质', qualityLabel);
  pushRow(baseRows, '稀有度', item.稀有度);
  pushRow(baseRows, '数量', item.数量);
  pushRow(baseRows, '获取途径', item.获取途径);
  pushRow(baseRows, '装备槽位', item.装备槽位);
  if (item.已装备 !== undefined) pushRow(baseRows, '已装备', item.已装备);
  pushRow(baseRows, '是否绑定', item.是否绑定);
  pushRow(baseRows, '堆叠上限', item.堆叠上限);
  pushRow(baseRows, '价值', item.价值);
  pushRow(baseRows, '重量', item.重量);
  pushRow(baseRows, '等级需求', item.等级需求);
  pushRow(baseRows, '来源', item.来源);
  pushRow(baseRows, '制作者', item.制作者);
  pushRow(baseRows, '材质', item.材质);
  pushRow(baseRows, '标签', item.标签);
  if (baseRows.length) sections.push({ title: '基础信息', rows: baseRows });

  const combatRows: DetailRow[] = [];
  pushRow(combatRows, '攻击力', item.攻击力);
  pushRow(combatRows, '防御力', item.防御力);
  pushRow(combatRows, '恢复量', item.恢复量);
  if (combatRows.length) sections.push({ title: '战斗数值', rows: combatRows });

  const effectRows: DetailRow[] = [];
  pushRow(effectRows, '效果', item.效果);
  if (item.攻击特效) pushRow(effectRows, '攻击特效', item.攻击特效);
  if (item.防御特效) pushRow(effectRows, '防御特效', item.防御特效);
  if (effectRows.length) sections.push({ title: '特效', rows: effectRows });

  if (item.附加属性 && item.附加属性.length > 0) {
    const affixRows = item.附加属性.map(stat => ({
      label: stat.名称,
      value: stat.数值
    }));
    sections.push({ title: '附加属性', rows: affixRows });
  }

  if (item.武器) {
    const weaponRows: DetailRow[] = [];
    pushRow(weaponRows, '类型', item.武器.类型);
    pushRow(weaponRows, '伤害类型', item.武器.伤害类型);
    pushRow(weaponRows, '射程', item.武器.射程);
    pushRow(weaponRows, '攻速', item.武器.攻速);
    if (item.武器.双手 !== undefined) pushRow(weaponRows, '双手', item.武器.双手);
    pushRow(weaponRows, '特性', item.武器.特性);
    if (weaponRows.length) sections.push({ title: '武器', rows: weaponRows });
  }

  if (item.防具) {
    const armorRows: DetailRow[] = [];
    pushRow(armorRows, '类型', item.防具.类型);
    pushRow(armorRows, '部位', item.防具.部位);
    pushRow(armorRows, '护甲等级', item.防具.护甲等级);
    pushRow(armorRows, '抗性', item.防具.抗性);
    if (armorRows.length) sections.push({ title: '防具', rows: armorRows });
  }

  if (item.消耗) {
    const consumeRows: DetailRow[] = [];
    pushRow(consumeRows, '类别', item.消耗.类别);
    pushRow(consumeRows, '持续', item.消耗.持续);
    pushRow(consumeRows, '冷却', item.消耗.冷却);
    pushRow(consumeRows, '副作用', item.消耗.副作用);
    if (consumeRows.length) sections.push({ title: '消耗', rows: consumeRows });
  }

  if (item.材料) {
    const materialRows: DetailRow[] = [];
    pushRow(materialRows, '来源', item.材料.来源);
    pushRow(materialRows, '用途', item.材料.用途);
    pushRow(materialRows, '处理', item.材料.处理);
    if (materialRows.length) sections.push({ title: '材料', rows: materialRows });
  }

  if (item.魔剑) {
    const magicRows: DetailRow[] = [];
    pushRow(magicRows, '魔法名称', item.魔剑.魔法名称);
    pushRow(magicRows, '属性', item.魔剑.属性);
    pushRow(magicRows, '威力', item.魔剑.威力);
    pushRow(magicRows, '触发方式', item.魔剑.触发方式);
    pushRow(magicRows, '冷却', item.魔剑.冷却);
    pushRow(magicRows, '剩余次数', item.魔剑.剩余次数);
    pushRow(magicRows, '最大次数', item.魔剑.最大次数);
    pushRow(magicRows, '破损率', item.魔剑.破损率);
    pushRow(magicRows, '过载惩罚', item.魔剑.过载惩罚);
    pushRow(magicRows, '备注', item.魔剑.备注);
    if (magicRows.length) sections.push({ title: '魔剑', rows: magicRows });
  }

  return sections;
};

export const MobileInventoryView: React.FC<MobileInventoryViewProps> = ({
  items,
  equipment,
  onEquipItem,
  onUnequipItem,
  onUseItem
}) => {
  const [filter, setFilter] = useState<'ALL' | 'WEAPON' | 'ARMOR' | 'CONSUMABLE'>('ALL');

  const allItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const safeEquipment = equipment || {};

    const equippedList: InventoryItem[] = [];
    Object.entries(safeEquipment).forEach(([slot, itemName]) => {
      if (itemName) {
        const existsInInventory = safeItems.some(i => i.名称 === itemName);
        if (!existsInInventory) {
          equippedList.push({
            id: `equipped-${slot}`,
            名称: itemName as string,
            描述: '当前已装备',
            数量: 1,
            类型: slot === '主手' || slot === '副手' ? 'weapon' : 'armor',
            品质: 'Common',
            已装备: true,
            装备槽位: slot
          });
        }
      }
    });
    return [...safeItems, ...equippedList];
  }, [items, equipment]);

  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return allItems;
    return allItems.filter(i => getItemCategory(i) === filter);
  }, [allItems, filter]);

  const getItemIcon = (item: InventoryItem) => {
    switch(getItemCategory(item)) {
      case 'WEAPON': return <Sword size={20} />;
      case 'ARMOR': return <Shield size={20} />;
      case 'LOOT': return <Gem size={20} />;
      case 'CONSUMABLE': return <Beaker size={20} />;
      case 'MATERIAL': return <Leaf size={20} />;
      case 'KEY_ITEM': return <Box size={20} />;
      default: return <Package size={20} />;
    }
  };

  const getRarityColor = (quality: string = 'Common') => {
    switch(normalizeQuality(quality)) {
      case 'Legendary': return 'text-yellow-400 border-yellow-500 bg-yellow-950/20';
      case 'Epic': return 'text-purple-300 border-purple-500 bg-purple-950/20';
      case 'Rare': return 'text-cyan-300 border-cyan-500 bg-cyan-950/20';
      case 'Broken': return 'text-red-400 border-red-600 bg-red-950/20';
      default: return 'text-blue-100 border-zinc-700 bg-zinc-900';
    }
  };

  const LABELS = {
    'ALL': '全部',
    'WEAPON': '武器',
    'ARMOR': '防具',
    'CONSUMABLE': '消耗品'
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative">
      {/* Filter Tabs */}
      <div className="flex overflow-x-auto bg-zinc-900 border-b border-blue-900 shrink-0 no-scrollbar py-1">
        {(['ALL', 'WEAPON', 'ARMOR', 'CONSUMABLE'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 text-xs font-bold uppercase whitespace-nowrap transition-all transform skew-x-[-10deg] mx-1 border-2
              ${filter === f 
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-blue-800 hover:text-blue-400'
              }
            `}
          >
            <span className="block transform skew-x-[10deg]">{LABELS[f]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] bg-zinc-950">
        {filteredItems.length > 0 ? filteredItems.map(item => {
          const quality = item.品质 || item.稀有度 || 'Common';
          const qualityLabel = getQualityLabel(quality);
          const rarityStyle = getRarityColor(quality);
          const durCurrent = item.耐久 ?? 0;
          const durMax = item.最大耐久 ?? 100;
          const hasDurability = item.耐久 !== undefined;
          const detailSections = buildItemDetailSections(item, qualityLabel);

          return (
            <div 
              key={item.id}
              className={`relative p-3 border-l-4 transition-all bg-black ${rarityStyle.split(' ')[2]} border-zinc-800 ${hasDurability ? 'pr-10 pb-10' : ''}`}
            >
              {hasDurability && (
                <div className="absolute bottom-3 right-3 pointer-events-none">
                  <DurabilityRing current={durCurrent} max={durMax} />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded border ${rarityStyle.split(' ')[1]} ${rarityStyle.split(' ')[0]} shrink-0 bg-black`}>
                  {getItemIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className={`font-bold text-sm truncate uppercase font-display tracking-wide ${rarityStyle.split(' ')[0]}`}>
                      {item.名称}
                    </h4>
                    {item.数量 > 1 && <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 border border-zinc-700">x{item.数量}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-zinc-500 uppercase">{qualityLabel} {getTypeLabel(item.类型)}</span>
                    {item.已装备 && <span className="text-[9px] text-black font-bold bg-cyan-500 px-1 uppercase skew-x-[-10deg]">已装备</span>}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed italic">“{item.描述}”</p>

              {detailSections.length > 0 && (
                <div className="space-y-2 text-[10px] font-mono mt-2">
                  {detailSections.map((section, sectionIndex) => (
                    <div
                      key={`${section.title}-${sectionIndex}`}
                      className="bg-black/50 p-2 border border-zinc-800"
                    >
                      <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">
                        {section.title}
                      </div>
                      <div className="grid grid-cols-1 gap-y-1">
                        {section.rows.map((row, rowIndex) => (
                          <div key={`${section.title}-${rowIndex}`} className="flex justify-between gap-2">
                            <span className="text-zinc-500">{row.label}</span>
                            <span className="text-zinc-200 text-right break-words">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3 pr-10">
                {(isWeaponItem(item) || isArmorItem(item)) && (
                  item.已装备 ? (
                    <button 
                      onClick={() => onUnequipItem(getDefaultEquipSlot(item), item.名称, item.id)}
                      className="flex-1 py-2 bg-black text-yellow-500 border-2 border-yellow-600 font-bold uppercase flex items-center justify-center gap-2"
                    >
                      <LogOut size={14}/> 卸下
                    </button>
                  ) : (
                    <button 
                      onClick={() => onEquipItem(item)}
                      className="flex-1 py-2 bg-blue-600 text-white font-bold uppercase flex items-center justify-center gap-2 border-2 border-blue-400"
                    >
                      <Shield size={14}/> 装备
                    </button>
                  )
                )}
                {getItemCategory(item) === 'CONSUMABLE' && (
                  <button 
                    onClick={() => onUseItem(item)}
                    className="flex-1 py-2 bg-green-600 text-white font-bold uppercase flex items-center justify-center gap-2 border-2 border-green-400"
                  >
                    <ArrowRightCircle size={14}/> 使用
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 text-blue-900">
            <Box size={48} className="mb-2 opacity-50"/>
            <span className="uppercase font-display tracking-widest">暂无物品</span>
          </div>
        )}
      </div>
    </div>
  );
};
