import { InventoryItem } from './item';

export interface InteractionMemory {
  内容: string;
  时间戳?: string;
}

export interface Confidant {
  id: string;
  姓名: string;

  // --- 基础数据 ---
  称号?: string;
  性别?: string;
  种族: string;
  年龄?: number;
  眷族: string;
  身份: '冒险者' | '神明' | '平民' | string;

  档案?: string; // combined profile

  好感度?: number;
  关系状态?: string; // relationshipStatus

  // 状态标识
  是否在场?: boolean; // isPresent
  特别关注: boolean; // isSpecialAttention
  强制包含上下文?: boolean; // forceIncludeInContext

  // 记忆系统
  记忆: InteractionMemory[];
  头像?: string;
  排除提示词?: boolean;

  // --- 战斗/队友数据 ---
  是否队友?: boolean; // isPartyMember
  等级: string | number;
  已知能力?: string; // knownAbilities

  // 生存数值 (Vitals)
  生存数值?: {
    当前生命: number;
    最大生命: number;
    当前精神: number;
    最大精神: number;
    当前体力: number;
    最大体力: number;
  };

  // 能力值 (Stats)
  能力值?: {
    力量: number | string;
    耐久: number | string;
    灵巧: number | string;
    敏捷: number | string;
    魔力: number | string;
  };
  隐藏基础能力值?: {
    力量: number | string;
    耐久: number | string;
    灵巧: number | string;
    敏捷: number | string;
    魔力: number | string;
  };

  // 装备 (Equipment)
  装备?: {
    主手?: string;
    副手?: string;
    身体?: string;
    头部?: string;
    腿部?: string;
    足部?: string;
    饰品?: string;
  };

  // 独立背包
  背包?: InventoryItem[];
}
