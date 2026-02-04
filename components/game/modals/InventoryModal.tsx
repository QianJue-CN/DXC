import React, { useState, useMemo, useEffect } from 'react';
import { Package, Shield, Sword, Box, Gem, ArrowRightCircle, LogOut, Beaker, Leaf, Moon } from 'lucide-react';
import { InventoryItem } from '../../../types';
import { getItemCategory, getDefaultEquipSlot, getTypeLabel, normalizeQuality, getQualityLabel, isWeaponItem, isArmorItem } from '../../../utils/itemUtils';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  equipment: { [key: string]: string }; 
  initialTab?: string;
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

export const InventoryModal: React.FC<InventoryModalProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  equipment,
  initialTab = 'ALL',
  onEquipItem,
  onUnequipItem,
  onUseItem
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Merge equipped items logic 
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

  const TAB_LABELS: Record<string, string> = {
    'ALL': '全部',
    'WEAPON': '武器',
    'ARMOR': '防具',
    'CONSUMABLE': '消耗品',
    'MATERIAL': '材料',
    'KEY_ITEM': '关键物品',
    'LOOT': '战利品',
    'OTHER': '杂项'
  };

  const categories = useMemo(() => {
    const cats = new Set<string>(['ALL']);
    allItems.forEach(item => {
      cats.add(getItemCategory(item));
    });
    return Array.from(cats);
  }, [allItems]);

  useEffect(() => {
    if (isOpen) {
      if (!categories.includes(activeTab) && activeTab !== 'ALL') {
        setActiveTab('ALL');
      } else if (initialTab && categories.includes(initialTab)) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, categories, initialTab]);

  const filteredItems = useMemo(() => {
    let filtered = allItems;
    if (activeTab !== 'ALL') {
      filtered = allItems.filter(i => getItemCategory(i) === activeTab);
    }
    return filtered.sort((a, b) => {
      if (a.已装备 !== b.已装备) return a.已装备 ? -1 : 1;
      return 0;
    });
  }, [allItems, activeTab]);

  const handleUseItem = (item: InventoryItem) => {
    onUseItem(item);
  };

  const handleEquipClick = (item: InventoryItem) => {
    onEquipItem(item);
  };

  const handleUnequipClick = (item: InventoryItem) => {
    const slot = getDefaultEquipSlot(item);
    onUnequipItem(slot, item.名称, item.id);
  };

  const getItemIcon = (item: InventoryItem) => {
    switch(getItemCategory(item)) {
      case 'WEAPON': return <Sword size={28} />;
      case 'ARMOR': return <Shield size={28} />;
      case 'LOOT': return <Gem size={28} />;
      case 'CONSUMABLE': return <Beaker size={28} />;
      case 'MATERIAL': return <Leaf size={28} />;
      case 'KEY_ITEM': return <Box size={28} />;
      default: return <Package size={28} />;
    }
  };

  const getRarityConfig = (quality: string = 'Common') => {
    switch(normalizeQuality(quality)) {
      case 'Legendary': return { border: 'border-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-900/40', shadow: 'shadow-yellow-500/50' };
      case 'Epic': return { border: 'border-purple-400', text: 'text-purple-300', bg: 'bg-purple-900/40', shadow: 'shadow-purple-500/50' };
      case 'Rare': return { border: 'border-cyan-400', text: 'text-cyan-300', bg: 'bg-cyan-900/40', shadow: 'shadow-cyan-500/50' };
      case 'Broken': return { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-950/40', shadow: 'shadow-red-500/50' };
      case 'Pristine': return { border: 'border-white', text: 'text-white', bg: 'bg-zinc-800', shadow: 'shadow-white/20' };
      default: return { border: 'border-blue-900', text: 'text-blue-200', bg: 'bg-black', shadow: 'shadow-blue-900/30' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-7xl h-[90vh] relative flex flex-col md:flex-row overflow-hidden border-4 border-blue-900 bg-black shadow-[0_0_50px_rgba(30,58,138,0.5)]">
        {/* Background Decor */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[60%] h-full bg-blue-900/20 transform -skew-x-12 translate-x-32" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-900" />
        </div>

        {/* Sidebar */}
        <div className="md:w-64 bg-zinc-950/90 z-10 flex flex-col border-b-4 md:border-b-0 md:border-r-4 border-blue-800 relative">
          <div className="p-6 bg-blue-700 text-white transform -skew-x-6 -ml-4 w-[120%] border-b-4 border-black shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-80" />
            <div className="transform skew-x-6 ml-4 flex items-center gap-3 relative z-10">
              <Moon size={32} className="text-cyan-200 fill-current" />
              <div>
                <h2 className="text-4xl font-display uppercase tracking-tighter italic text-cyan-50">背包</h2>
                <p className="text-xs font-mono tracking-widest opacity-80 text-blue-200">INVENTORY SYSTEM</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 relative z-10">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`w-full text-left px-4 py-3 font-display uppercase tracking-wider text-lg border-l-4 transition-all transform hover:translate-x-2
                  ${activeTab === cat 
                    ? 'border-cyan-400 bg-blue-900/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                    : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-blue-500'
                  }
                `}
              >
                {TAB_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          <button 
            onClick={onClose} 
            className="p-4 bg-zinc-900 text-zinc-500 hover:text-cyan-400 hover:bg-black border-t-2 border-zinc-800 transition-colors uppercase font-bold flex items-center justify-center gap-2"
          >
            <LogOut size={20} /> 关闭
          </button>
        </div>

        {/* Item Grid Area */}
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-black/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {filteredItems.length > 0 ? filteredItems.map((item) => {
              const quality = item.品质 || item.稀有度 || 'Common';
              const qualityLabel = getQualityLabel(quality);
              const style = getRarityConfig(quality);

              const durCurrent = item.耐久 ?? 0;
              const durMax = item.最大耐久 ?? 100;
              const hasDurability = item.耐久 !== undefined;
              const isBroken = hasDurability && durCurrent <= 0;
              const detailSections = buildItemDetailSections(item, qualityLabel);

              return (
                <div 
                  key={item.id} 
                  className={`group relative min-h-[220px] flex flex-col border-2 transition-all duration-300 
                    ${style.border} ${style.bg} hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:z-20 hover:border-cyan-400
                    ${item.已装备 ? 'ring-1 ring-offset-2 ring-offset-black ring-cyan-500' : ''}
                  `}
                >
                  <div className={`absolute top-0 right-0 p-1 px-2 text-[10px] font-bold uppercase tracking-widest border-l-2 border-b-2
                    ${item.已装备 ? 'bg-cyan-900 border-cyan-500 text-cyan-200' : `bg-black ${style.border} ${style.text}`}
                  `}>
                    {item.已装备 ? '已装备' : qualityLabel}
                  </div>

                  {hasDurability && (
                    <div className="absolute bottom-3 right-3 pointer-events-none">
                      <DurabilityRing current={durCurrent} max={durMax} />
                    </div>
                  )}

                  <div className="p-4 pt-12 flex gap-4 items-start">
                    <div className={`w-14 h-14 shrink-0 flex items-center justify-center border-2 bg-black/80 ${style.border} ${style.text} group-hover:bg-blue-900/20 group-hover:text-cyan-300 transition-colors`}>
                      {getItemIcon(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-display text-xl uppercase tracking-wide truncate ${style.text} ${isBroken ? 'line-through opacity-50' : ''} group-hover:text-white transition-colors`}>
                        {item.名称}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-black/50 px-1.5 py-0.5 border border-zinc-700 text-zinc-400 group-hover:border-blue-500 group-hover:text-blue-300 transition-colors">
                          x{item.数量}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-zinc-500">{getTypeLabel(item.类型)}</span>
                        {item.魔剑 && (
                          <span className="text-[9px] font-mono uppercase text-purple-300 border border-purple-700/60 px-1.5 py-0.5">
                            魔剑
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`flex-1 px-4 pb-2 flex flex-col gap-2 ${hasDurability ? 'pr-10 pb-10' : ''}`}>
                    <p className="text-xs text-cyan-100/80 italic font-serif leading-relaxed">
                      “{item.描述}”
                    </p>

                    {detailSections.length > 0 && (
                      <div className="space-y-2 text-[10px] font-mono">
                        {detailSections.map((section, sectionIndex) => (
                          <div
                            key={`${section.title}-${sectionIndex}`}
                            className="bg-black/40 p-2 border border-blue-900/30 group-hover:border-cyan-500/30 transition-colors"
                          >
                            <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">
                              {section.title}
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
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
                  </div>

                  <div className="px-4 pb-4 mt-auto flex gap-2 pr-12">
                    {(isWeaponItem(item) || isArmorItem(item)) && (
                      item.已装备 ? (
                        <ActionButton onClick={() => handleUnequipClick(item)} label="卸下" color="yellow" icon={<LogOut size={14}/>} />
                      ) : (
                        <ActionButton onClick={() => handleEquipClick(item)} label="装备" color="cyan" icon={<Shield size={14}/>} />
                      )
                    )}
                    {getItemCategory(item) === 'CONSUMABLE' && (
                      <ActionButton onClick={() => handleUseItem(item)} label="使用" color="green" icon={<ArrowRightCircle size={14}/>} />
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full flex flex-col items-center justify-center h-64 opacity-50">
                <Package size={64} className="mb-4 text-blue-900" />
                <h3 className="text-2xl font-display uppercase text-blue-800">背包是空的</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, label, color, icon }: any) => {
  const colors: any = {
    yellow: 'border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black',
    cyan: 'border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black',
    green: 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black',
  };
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-2 border-2 ${colors[color]} font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
    >
      {icon} {label}
    </button>
  );
};
