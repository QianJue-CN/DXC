
export interface Enemy {
  id: string;
  名称: string;
  当前生命值?: number;
  最大生命值?: number;
  当前精神MP?: number;
  最大精神MP?: number;
  攻击力?: number;
  描述: string;
  图片?: string;
  等级?: number; // Level (includes threat logic)
  技能?: string[]; // Skills
  生命值?: number; // 旧字段兼容
  精神力?: number; // MP 旧字段兼容
  最大精神力?: number; // 旧字段兼容
}

export interface CombatState {
  是否战斗中: boolean;
  // 当前回合 removed
  敌方: Enemy[] | null;
  战斗记录: string[];
  上一次行动?: string;
}
