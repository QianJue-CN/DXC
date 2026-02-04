import { InventoryItem } from './item';

// --- 简化地点结构（移除坐标与尺寸） ---
export interface LocationMacro {
  id: string;
  名称: string;
  地点?: string;
  描述?: string;
  内容?: string[];
}

export interface LocationMid {
  id: string;
  名称: string;
  描述?: string;
  归属?: string;
  内部建筑?: string[];
}

export interface LocationSmall {
  id: string;
  名称: string;
  描述?: string;
  归属?: string;
}

export interface WorldMapData {
  macroLocations: LocationMacro[];
  midLocations: LocationMid[];
  smallLocations: LocationSmall[];
  current?: {
    macroId?: string;
    midId?: string;
    smallId?: string;
  };
}

export interface NpcBackgroundTracking {
  NPC: string;
  当前行动: string;
  地点?: string;
  位置?: string;
  计划阶段?: string[];
  当前阶段?: number;
  阶段结束时间?: string;
  进度?: string;
  预计完成?: string;
}

export interface WarGameState {
  状态?: '未开始' | '筹备' | '进行中' | '结束' | string;
  参战眷族: string[];
  形式: string;
  赌注: string;
  举办时间?: string;
  结束时间?: string;
  结果?: string;
  备注?: string;
}

export interface RumorCountdown {
  主题: string;
  广为人知日: string;
  风波平息日: string;
}

// --- 世界状态 ---
export interface WorldState {
  地下城异常指数: number;
  公会官方通告: string[];
  街头传闻: RumorCountdown[];
  NPC后台跟踪: NpcBackgroundTracking[];
  战争游戏?: WarGameState;
  下次更新?: string;
}

export interface FamiliaState {
  名称: string;
  等级: string;
  主神: string;
  资金: number;
  声望: number;
  设施状态?: any;
  仓库: InventoryItem[];
}
