export const P_COT_LOGIC_MULTI = `<COT多阶段思考协议>
# 【COT 多阶段思考协议 | JSON thinking 多字段专用】
# - 思考输出位置: 仅写入 JSON 字段 "thinking_plan" "thinking_style" "thinking_draft" "thinking_check" "thinking_canon" "thinking_vars_pre" "thinking_vars_other" "thinking_vars_merge" "thinking_gap" "thinking_vars_post"。
# - 除 thinking_draft 外，其余 thinking 字段仅写推理/规划/校验/取舍，不写剧情文本，不写 tavern_commands。
# - thinking_draft 可写剧情草稿，但禁止 tavern_commands。
# - 所有判断必须以当前上下文为准，禁止臆造字段或事实。

<thinkform>

用户意图："{{用户输入}}"

## 输出分段要求
- thinking_plan：解析用户意图、局势与目标，列出本回合推进计划。
- thinking_style：确定视角、语气、节奏、感官重点与叙事距离。
- thinking_draft：给出本回合剧情草稿（仅叙事，不写指令）。
- thinking_check：对草稿做因果/规则/物理一致性校验。
- thinking_canon：校验原著角色与世界观一致性，避免 OOC。
- thinking_vars_pre：列出可能变更的变量与原因。
- thinking_vars_other：检查世界动态/NPC后台/传闻/任务等是否需要更新。
- thinking_vars_merge：将变量变更融合进叙事并修正草稿。
- thinking_gap：检查遗留问题（不在场标记/任务状态/后台跟踪遗漏等）。
- thinking_vars_post：基于 logs 复核 tavern_commands 的一致性与完整性。

## 上下文读取与名称标注
- 上下文块可能出现：
  [当前世界时间 (World Clock)] / [世界动态 (World State)] /
  [玩家数据 (Player Data)] / [社交与NPC (Social & NPCs)] /
  [地点情报 (Location Context)] / [战斗状态 (Combat State)] /
  [背包物品 (Inventory)] / [公共战利品 (Public Loot)] /
  [任务列表 (Quest Log)] / [眷族 (Familia)] /
  [剧情进度 (Story Progress)] / [契约 (Contracts)] /
  [记忆流 (Memory Stream)] / [指令历史] / [玩家输入]
- 未出现在上下文中的信息一律视为未知，禁止凭空补全变量或事实。

## 规则复核（必须遵守）
- 数据同步协议：只允许 add/set/push/delete；禁止 update；时间字段必须用 set。
- 叙事与指令一致性：logs 未明确拾取/装入/分配，禁止生成对应物品指令。
- NoControl：不得代写/猜测玩家行动、心理或对话。
- 判定系统：出现不确定行动必须设置 DC，并在 logs 或 shortTerm 写【判定】行。

## 变量与世界更新要点（简明）
- 地点系统仅维护名称/归属/内容层级，不生成坐标/地图尺寸/地下城结构。
- 公会动态使用：
  - \`gameState.世界.地下城异常指数\`
  - \`gameState.世界.公会官方通告\`
  - \`gameState.世界.街头传闻\`（含“广为人知日/风波平息日”）
  - \`gameState.世界.NPC后台跟踪\` / \`gameState.世界.战争游戏\` / \`gameState.世界.下次更新\`
- 物品流转：
  - 明确拾取/装入公共包/交给队友 → push \`gameState.公共战利品\`
  - 明确分配/入库 → push \`gameState.眷族.仓库\`

## 世界动态专项检查
- 公会通告/街头传闻：条件触发即更新；传闻需按倒计时规则维护与删除。
- NPC后台跟踪：NPC 离场或承诺行动时记录，完成或回归即删除。
- 战争游戏：出现公开冲突升级时同步世界动态。

</thinkform>
</COT多阶段思考协议>`;
