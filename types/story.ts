export interface StoryDivergence {
  说明: string;
  分点: string[]; // 每点<=20字，建议<=30点，超出需归纳
  归纳总结?: string;
}

export interface StoryPlan {
  规划长期剧情走向: string;
  规划中期剧情走向: string;
  规划短期剧情走向: string;
}

export interface StoryActivationEvent {
  事件: string;
  激活时间?: string;
  激活条件?: string;
}

export interface StoryState {
  对应原著对应章节: string;
  对应章节名: string;
  原著大概剧情走向: string; // 200字内
  本世界分歧剧情: StoryDivergence;
  剧情规划: StoryPlan;
  待激活事件: StoryActivationEvent[];
}

export interface Contract {
  id: string;
  名称: string;
  描述: string;
  状态: 'active' | 'completed' | 'failed' | 'expired' | string;
  条款: string;
  开始时间?: string;
  结束时间?: string;
  结束条件?: string;
  违约代价?: string;
  备注?: string;
}

export interface TaskLog {
  时间戳?: string;
  内容: string;
}

export interface Task {
  id: string;
  标题: string;
  描述: string;
  状态: 'active' | 'completed' | 'failed';
  奖励: string;
  评级: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

  接取时间?: string;
  结束时间?: string;
  截止时间?: string;
  日志?: TaskLog[];
}
