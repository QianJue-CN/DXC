import React, { useState } from 'react';
import { X, Globe, Mic2, AlertTriangle, Scroll, Clock, Radar, ListChecks, Swords } from 'lucide-react';
import { WorldState } from '../../../types';

interface DynamicWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldState?: WorldState;
  npcStates?: any[];
  gameTime?: string;
  onSilentWorldUpdate?: () => void;
  onForceNpcBacklineUpdate?: () => void;
}

type WorldTab = 'GUILD' | 'RUMORS' | 'TRACKING' | 'WAR_GAME';

const parseGameTime = (input?: string) => {
  if (!input) return null;
  const dayMatch = input.match(/第\s*(\d+)\s*日/);
  const timeMatch = input.match(/(\d{1,2}):(\d{2})/);
  if (!dayMatch || !timeMatch) return null;
  const day = parseInt(dayMatch[1], 10);
  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  if ([day, hour, minute].some(n => Number.isNaN(n))) return null;
  return day * 24 * 60 + hour * 60 + minute;
};

const parseDay = (label?: string) => {
  if (!label) return null;
  const match = label.match(/第\s*(\d+)\s*日/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  return Number.isNaN(day) ? null : day;
};

export const DynamicWorldModal: React.FC<DynamicWorldModalProps> = ({ 
  isOpen, 
  onClose,
  worldState,
  gameTime,
  onSilentWorldUpdate,
  onForceNpcBacklineUpdate
}) => {
  const [activeTab, setActiveTab] = useState<WorldTab>('GUILD');

  const safeWorldState: WorldState = worldState || {
    地下城异常指数: 0,
    公会官方通告: [],
    街头传闻: [],
    NPC后台跟踪: [],
    战争游戏: { 状态: "未开始", 参战眷族: [], 形式: "", 赌注: "", 举办时间: "", 结束时间: "", 结果: "", 备注: "" },
    下次更新: "未知"
  };

  const nowValue = parseGameTime(gameTime);
  const nextValue = parseGameTime(safeWorldState.下次更新);
  const isUpdateDue = nowValue !== null && nextValue !== null ? nowValue >= nextValue : false;

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-in zoom-in-95 duration-200">
      <div className="w-full h-full md:h-[85vh] md:max-w-6xl bg-[#0f172a] border-0 md:border-4 border-[#3b82f6] relative flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.3)]">
        {/* Header */}
        <div className="bg-[#1e3a8a] p-4 flex justify-between items-center border-b-2 border-[#3b82f6] shrink-0">
          <div className="flex items-center gap-3 text-white">
            <Globe className="animate-spin-slow" />
            <div>
              <h2 className="text-xl md:text-3xl font-display uppercase tracking-widest text-shadow-sm truncate">世界情报监测</h2>
              <div className="text-[10px] font-mono opacity-70">WORLD MONITOR // ORARIO</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:text-[#1e3a8a] text-white transition-colors border border-white rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-[#020617] border-b md:border-b-0 md:border-r border-[#1e293b] p-0 md:p-4 flex md:flex-col shrink-0 overflow-x-auto">
            <TabButton 
              label="公会通告" 
              icon={<Scroll size={18}/>} 
              active={activeTab === 'GUILD'} 
              onClick={() => setActiveTab('GUILD')} 
            />
            <TabButton 
              label="街头传闻" 
              icon={<Mic2 size={18}/>} 
              active={activeTab === 'RUMORS'} 
              onClick={() => setActiveTab('RUMORS')} 
            />
            <TabButton 
              label="战争游戏" 
              icon={<Swords size={18}/>} 
              active={activeTab === 'WAR_GAME'} 
              onClick={() => setActiveTab('WAR_GAME')} 
            />
            <TabButton 
              label="后台跟踪" 
              icon={<Radar size={18}/>} 
              active={activeTab === 'TRACKING'} 
              onClick={() => setActiveTab('TRACKING')} 
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 pt-16 md:p-8 md:pt-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-[#0f172a] relative overflow-y-auto custom-scrollbar pb-32 md:pb-8">
            {/* Next Update Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/50 px-3 py-2 rounded border border-blue-900/50">
              <Clock size={12} className="text-blue-400" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-zinc-400 font-mono">当前时间: {gameTime || "未知"}</span>
                <span className="text-[10px] text-zinc-400 font-mono">下次更新: {safeWorldState.下次更新 || "计算中..."}</span>
                <span className={`text-[10px] font-mono ${isUpdateDue ? 'text-green-400' : 'text-zinc-500'}`}>
                  {isUpdateDue ? '已到更新时间' : '监测中'}
                </span>
              </div>
              {isUpdateDue && onSilentWorldUpdate && (
                <button
                  onClick={onSilentWorldUpdate}
                  className="ml-2 px-2 py-1 text-[10px] uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500"
                >
                  静默更新
                </button>
              )}
            </div>

            {activeTab === 'GUILD' && <GuildPanel world={safeWorldState} />}
            {activeTab === 'RUMORS' && <RumorsPanel world={safeWorldState} gameTime={gameTime} />}
            {activeTab === 'WAR_GAME' && <WarGamePanel world={safeWorldState} />}
            {activeTab === 'TRACKING' && <TrackingPanel world={safeWorldState} onForceNpcBacklineUpdate={onForceNpcBacklineUpdate} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ label, icon, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 md:flex-none md:w-full text-center md:text-left p-3 flex items-center justify-center md:justify-start gap-2 md:gap-3 font-display uppercase tracking-wide transition-all border-b-4 md:border-b-0 md:border-l-4 whitespace-nowrap text-sm md:text-base
      ${active 
        ? 'bg-[#1e293b] border-blue-500 text-blue-400' 
        : 'border-transparent text-zinc-500 hover:text-white hover:bg-[#0f172a]'
      }
    `}
  >
    {icon} <span>{label}</span>
  </button>
);

// --- Panels ---

const GuildPanel = ({ world }: { world: WorldState }) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
    <div className="border-b border-blue-900 pb-2 mb-6">
      <h3 className="text-blue-400 font-display text-2xl uppercase tracking-widest">公会官方通告</h3>
    </div>

    {/* Irregularity */}
    <div className="bg-[#020617] p-6 border border-blue-900/50 shadow-lg relative overflow-hidden">
      <div className="flex justify-between items-center mb-2 z-10 relative">
        <h4 className="text-white font-bold uppercase flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500"/> 地下城异常指数
        </h4>
        <span className="text-red-500 font-mono text-2xl font-bold">{world.地下城异常指数}%</span>
      </div>
      <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700 relative z-10">
        <div 
          className="h-full bg-gradient-to-r from-green-600 via-yellow-500 to-red-600 transition-all duration-1000"
          style={{ width: `${world.地下城异常指数}%` }}
        />
      </div>
      <p className="text-zinc-500 text-xs mt-3 italic relative z-10">
        {world.地下城异常指数 < 30 ? "目前处于稳定期，建议新人进行探索。" : 
          world.地下城异常指数 < 70 ? "中层区域观测到不规则怪物刷新，请注意安全。" : 
          "警报！深层区域出现强化种反应，非第一线冒险者请勿靠近。"}
      </p>
      <div className="absolute right-0 top-0 text-red-900/10 transform rotate-12 pointer-events-none">
        <AlertTriangle size={150} />
      </div>
    </div>

    {/* Announcements */}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-blue-300 font-bold uppercase text-sm border-l-4 border-blue-600 pl-2">公会官方通告</h4>
        <span className="text-[10px] text-zinc-600">SOURCE: GUILD HQ</span>
      </div>
      {world.公会官方通告.length > 0 ? (
        world.公会官方通告.map((news, i) => (
          <div key={i} className="bg-zinc-900/80 p-4 border-l-2 border-zinc-700 hover:border-blue-500 transition-colors flex justify-between group">
            <p className="text-zinc-300 font-sans text-sm">{news}</p>
          </div>
        ))
      ) : (
        <div className="text-zinc-600 italic p-4 text-center border border-dashed border-zinc-800">暂无通告</div>
      )}
    </div>
  </div>
);

const RumorsPanel = ({ world, gameTime }: { world: WorldState; gameTime?: string }) => {
  const currentDay = parseDay(gameTime);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-green-900 pb-2 mb-6">
        <h3 className="text-green-400 font-display text-2xl uppercase tracking-widest">街头传闻</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {world.街头传闻.length > 0 ? (
          world.街头传闻.map((rumor, i) => {
            const knownDay = parseDay(rumor.广为人知日);
            const calmDay = parseDay(rumor.风波平息日);
            const knownCountdown = currentDay !== null && knownDay !== null ? knownDay - currentDay : null;
            const calmCountdown = currentDay !== null && calmDay !== null ? calmDay - currentDay : null;
            const knownLabel = knownCountdown === null
              ? '未知'
              : knownCountdown <= 0 ? '已广为人知' : `还有 ${knownCountdown} 日`;
            const calmLabel = calmCountdown === null
              ? '未知'
              : calmCountdown <= 0 ? '风波已平息' : `还有 ${calmCountdown} 日`;

            return (
              <div key={i} className="flex gap-4 items-center bg-[#020617] p-4 border border-zinc-800 hover:border-green-600 transition-colors group">
                <div className="bg-green-900/20 w-12 h-12 flex items-center justify-center shrink-0 rounded-full group-hover:bg-green-600 group-hover:text-black transition-colors text-green-600">
                  <Mic2 size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-200 text-sm mb-2 font-bold">“{rumor.主题}”</p>
                  <div className="text-[10px] text-zinc-500">
                    到 <span className="text-green-300">{rumor.广为人知日}</span> 为广为人知，
                    到 <span className="text-emerald-300">{rumor.风波平息日}</span> 风波平息。
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                    <div className="flex items-center justify-between bg-black/40 px-2 py-1 border border-zinc-800">
                      <span>广为人知</span>
                      <span className="text-green-400">{knownLabel}</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 px-2 py-1 border border-zinc-800">
                      <span>风波平息</span>
                      <span className="text-emerald-400">{calmLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-zinc-600 border border-dashed border-zinc-800">
            <p>最近风平浪静，没有特别的流言。</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WarGamePanel = ({ world }: { world: WorldState }) => {
  const war = world.战争游戏 || { 状态: "未开始", 参战眷族: [], 形式: "", 赌注: "", 举办时间: "", 结束时间: "", 结果: "", 备注: "" };
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-red-900 pb-2 mb-6">
        <h3 className="text-red-400 font-display text-2xl uppercase tracking-widest">战争游戏</h3>
      </div>
      <div className="bg-[#020617] p-6 border border-red-900/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300">
          <div className="flex justify-between border-b border-red-900/30 pb-2">
            <span className="text-zinc-500">状态</span>
            <span className="text-red-300 font-mono">{war.状态 || "未开始"}</span>
          </div>
          <div className="flex justify-between border-b border-red-900/30 pb-2">
            <span className="text-zinc-500">形式</span>
            <span>{war.形式 || "待定"}</span>
          </div>
          <div className="flex justify-between border-b border-red-900/30 pb-2">
            <span className="text-zinc-500">举办时间</span>
            <span>{war.举办时间 || "未知"}</span>
          </div>
          <div className="flex justify-between border-b border-red-900/30 pb-2">
            <span className="text-zinc-500">结束时间</span>
            <span>{war.结束时间 || "未知"}</span>
          </div>
          <div className="md:col-span-2 flex justify-between border-b border-red-900/30 pb-2">
            <span className="text-zinc-500">赌注</span>
            <span className="text-red-200">{war.赌注 || "未公开"}</span>
          </div>
          <div className="md:col-span-2 flex justify-between">
            <span className="text-zinc-500">结果</span>
            <span className="text-emerald-300">{war.结果 || "待定"}</span>
          </div>
        </div>
        <div className="mt-4 text-xs text-zinc-400">
          参战眷族：{(war.参战眷族 || []).length > 0 ? war.参战眷族.join('、') : "暂无记录"}
        </div>
        {war.备注 && <div className="mt-2 text-[10px] text-zinc-500 italic">{war.备注}</div>}
      </div>
    </div>
  );
};

const TrackingPanel = ({ world, onForceNpcBacklineUpdate }: { world: WorldState; onForceNpcBacklineUpdate?: () => void }) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
    <div className="border-b border-cyan-900 pb-2 mb-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-cyan-400 font-display text-2xl uppercase tracking-widest">NPC 后台跟踪</h3>
        {onForceNpcBacklineUpdate && (
          <button
            onClick={onForceNpcBacklineUpdate}
            className="px-3 py-1 text-[10px] uppercase tracking-widest bg-cyan-600 text-black hover:bg-cyan-500 border border-cyan-300 shadow-sm"
          >
            强制刷新
          </button>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {world.NPC后台跟踪 && world.NPC后台跟踪.length > 0 ? (
        world.NPC后台跟踪.map((track, i) => (
          <div key={i} className="flex gap-4 items-start bg-[#020617] p-4 border border-zinc-800 hover:border-cyan-600 transition-colors group">
            <div className="bg-cyan-900/20 w-12 h-12 flex items-center justify-center shrink-0 rounded-full group-hover:bg-cyan-600 group-hover:text-black transition-colors text-cyan-600">
              <ListChecks size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-zinc-200 text-sm font-bold">{track.NPC}</div>
              <div className="text-zinc-400 text-xs">行动: {track.当前行动}</div>
              {(track.地点 || track.位置) && (
                <div className="text-[10px] text-zinc-500">地点: {track.地点 || track.位置}</div>
              )}
              {Array.isArray(track.计划阶段) && track.计划阶段.length > 0 && (
                <div className="text-[10px] text-zinc-500">
                  阶段: {(() => {
                    const total = track.计划阶段.length;
                    const rawIndex = typeof track.当前阶段 === 'number' ? track.当前阶段 : 0;
                    const normalizedIndex = rawIndex >= 1 ? rawIndex - 1 : rawIndex;
                    const safeIndex = Math.min(Math.max(normalizedIndex, 0), total - 1);
                    return `${safeIndex + 1}/${total}`;
                  })()}
                </div>
              )}
              {track.阶段结束时间 && <div className="text-[10px] text-zinc-500">阶段结束: {track.阶段结束时间}</div>}
              {track.进度 && <div className="text-[10px] text-emerald-400">进度: {track.进度}</div>}
              {track.预计完成 && <div className="text-[10px] text-zinc-500">预计完成: {track.预计完成}</div>}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-zinc-600 border border-dashed border-zinc-800">
          <p>暂无后台跟踪事项。</p>
        </div>
      )}
    </div>
  </div>
);
