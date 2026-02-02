import React, { useState } from 'react';
import { X, BookOpen, Clock, GitBranch, Target, AlertTriangle } from 'lucide-react';
import { StoryState } from '../../../types';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: StoryState;
  gameTime?: string;
  onCompleteStage?: (milestoneNote?: string) => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, story, gameTime, onCompleteStage }) => {
  const [manualMilestone, setManualMilestone] = useState('');
  if (!isOpen) return null;

  const safeStory: StoryState = story || {
    对应原著对应章节: '未知章节',
    对应章节名: '未知章节名',
    原著大概剧情走向: '暂无剧情数据。',
    本世界分歧剧情: { 说明: '暂无分歧说明。', 分点: [], 归纳总结: '' },
    剧情规划: {
      规划长期剧情走向: '暂无长期规划。',
      规划中期剧情走向: '暂无中期规划。',
      规划短期剧情走向: '暂无短期规划。'
    },
    待激活事件: []
  };

  const divergence = safeStory.本世界分歧剧情 || { 说明: '', 分点: [], 归纳总结: '' };
  const plan = safeStory.剧情规划 || {
    规划长期剧情走向: '',
    规划中期剧情走向: '',
    规划短期剧情走向: ''
  };

  const handleManualAdvance = () => {
    if (!onCompleteStage) return;
    const note = manualMilestone.trim();
    onCompleteStage(note || undefined);
    setManualMilestone('');
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-5xl bg-zinc-900 border-y-0 md:border-y-8 border-green-600 relative flex flex-col shadow-2xl overflow-hidden">
        <div className="absolute top-4 right-4 z-50">
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors border border-zinc-700 p-2 bg-black">
            <X size={24} />
          </button>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]" />

        <div className="p-8 md:p-12 flex flex-col relative z-10 h-full overflow-y-auto custom-scrollbar pb-32 md:pb-12">
          <div className="flex flex-col items-center text-center mb-10 mt-8 md:mt-0">
            <BookOpen size={48} className="text-green-600 mb-4" />
            <h2 className="text-zinc-500 uppercase tracking-[0.4em] text-xs mb-2">
              对应原著章节
            </h2>
            <h1 className="text-2xl md:text-4xl font-display uppercase text-white text-shadow">
              {safeStory.对应原著对应章节 || '未知章节'}
            </h1>
            <div className="mt-3 text-zinc-400 text-sm">
              {safeStory.对应章节名 || '未知章节名'}
            </div>
            <p className="mt-5 text-zinc-300 text-sm md:text-base leading-relaxed max-w-3xl">
              {safeStory.原著大概剧情走向 || '暂无剧情数据。'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-black/40 border-l-4 border-green-600 p-6 space-y-4">
              <div className="flex items-center gap-2 text-green-500 font-bold uppercase tracking-wider text-sm">
                <GitBranch size={16} /> 本世界分歧剧情
              </div>
              <div className="text-zinc-300 text-sm leading-relaxed">
                {divergence.说明 || '暂无分歧说明。'}
              </div>
              {(divergence.分点 || []).length > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {divergence.分点.map((point, idx) => (
                    <span key={`${point}-${idx}`} className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200">
                      {point}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 text-xs italic">暂无分歧点。</div>
              )}
              {divergence.归纳总结 && divergence.归纳总结.trim() && (
                <div className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
                  归纳总结: {divergence.归纳总结}
                </div>
              )}
            </div>

            <div className="bg-black/40 border-r-4 border-green-600 p-6 space-y-4 text-right">
              <div className="flex items-center justify-end gap-2 text-green-500 font-bold uppercase tracking-wider text-sm">
                <Target size={16} /> 剧情规划
              </div>
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">长期</div>
                  <div className="leading-relaxed">{plan.规划长期剧情走向 || '暂无'}</div>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">中期</div>
                  <div className="leading-relaxed">{plan.规划中期剧情走向 || '暂无'}</div>
                </div>
                <div className="border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">短期</div>
                  <div className="leading-relaxed">{plan.规划短期剧情走向 || '暂无'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-green-900/40 p-6 mb-8">
            <div className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-wider text-sm mb-4">
              <Clock size={14} /> 待激活事件
            </div>
            {(safeStory.待激活事件 || []).length > 0 ? (
              <div className="space-y-2 text-sm text-zinc-300">
                {(safeStory.待激活事件 || []).map((evt, idx) => (
                  <div key={`${evt.事件 || idx}`} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                    <span className="text-emerald-300 font-mono text-xs">【{evt.激活时间 || '未知时间'}】</span>
                    <span className="flex-1 text-zinc-200">{evt.事件 || '未知事件'}</span>
                    <span className="text-[10px] text-zinc-500">条件: {evt.激活条件 || '未知'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm italic">暂无待激活事件。</div>
            )}
          </div>

          {onCompleteStage && (
            <div className="bg-black/40 border border-green-900/40 p-6 mb-8">
              <div className="flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-wider text-sm mb-2">
                <AlertTriangle size={14} /> 标记剧情规划需要更新
                {gameTime && <span className="text-[10px] text-zinc-500">({gameTime})</span>}
              </div>
              <p className="text-zinc-500 text-xs mb-4">
                将在短期规划中写入“手动推进”标记，提示 AI 重新规划剧情。
              </p>
              <textarea
                value={manualMilestone}
                onChange={(e) => setManualMilestone(e.target.value)}
                placeholder="完成记录/备注（可选）"
                className="bg-zinc-900 border border-zinc-700 px-3 py-2 w-full h-16 resize-none text-xs text-zinc-300"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleManualAdvance}
                  className="px-4 py-2 bg-green-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-600"
                >
                  标记需要更新
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto w-full bg-zinc-800 p-4 text-center border-t border-green-900/50">
            <p className="text-zinc-500 text-xs font-mono">
              "英雄的愿望是白色的钟声。做出你的选择，冒险者。"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
