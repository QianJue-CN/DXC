import React, { useState, useMemo } from 'react';
import { Package, Sword, Shield, Box, Gem, ArrowRightCircle, LogOut, Beaker, Leaf, Star } from 'lucide-react';
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
    <div className="relative w-9 h-9 rounded-full" style={{ background: `conic-gradient(${color} ${deg}deg, rgba(24,24,27,0.8) 0deg)` }}>
      <div className="absolute inset-1 rounded-full bg-black flex items-center justify-center text-[8px] font-mono text-zinc-200">
        {current}/{max}
      </div>
    </div>
  );
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

          return (
            <div 
              key={item.id}
              className={`p-3 border-l-4 transition-all bg-black ${rarityStyle.split(' ')[2]} border-zinc-800`}
            >
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
                {hasDurability && (
                  <DurabilityRing current={durCurrent} max={durMax} />
                )}
              </div>

              <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed italic">“{item.描述}”</p>

              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono bg-black/50 p-2 border border-zinc-800 mt-2">
                {item.攻击力 !== undefined && <span className="text-red-400">攻击 {item.攻击力}</span>}
                {item.防御力 !== undefined && <span className="text-blue-400">防御 {item.防御力}</span>}
                {item.恢复量 !== undefined && <span className="text-green-400">恢复 {item.恢复量}</span>}
                {item.魔剑 && (
                  <span className="text-purple-300 col-span-2">魔剑 {item.魔剑.剩余次数 ?? "?"}/{item.魔剑.最大次数 ?? "?"}</span>
                )}
              </div>

              {item.附加属性 && item.附加属性.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.附加属性.map((stat, i) => (
                    <span key={i} className="text-[9px] bg-cyan-900/20 text-cyan-300 border border-cyan-800 px-2 py-1 flex items-center gap-1 font-bold uppercase tracking-wider">
                      <Star size={10} /> {stat.名称} <span className="text-white">{stat.数值}</span>
                    </span>
                  ))}
                </div>
              )}

              {(item.效果 || item.攻击特效) && (
                <div className="text-[10px] text-zinc-400 mt-2 space-y-1">
                  {item.效果 && <div><span className="text-zinc-500">效果:</span> {item.效果}</div>}
                  {item.攻击特效 && item.攻击特效 !== "无" && <div className="text-red-400 font-bold">特效: {item.攻击特效}</div>}
                </div>
              )}

              <div className="flex gap-2 mt-3">
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
