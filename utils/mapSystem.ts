import { Direction, Enemy, WorldMapData } from "../types";

// Helper to get opposite direction
export const getOppositeDir = (dir: Direction): Direction => {
  switch (dir) {
    case 'North': return 'South';
    case 'South': return 'North';
    case 'East': return 'West';
    case 'West': return 'East';
  }
};

// --- Combat Helper ---
export const generateEnemy = (floor: number, isBoss: boolean = false): Enemy => {
  const baseHp = 50 + (floor * 20);
  const baseAtk = 8 + (floor * 2);
  const baseMp = 20 + (floor * 6);
  const level = Math.max(1, Math.floor((floor - 1) / 12) + 1);

  if (isBoss) {
    return {
      id: 'boss_' + Date.now(),
      名称: `第${floor}层 迷宫孤王`,
      当前生命值: baseHp * 3,
      最大生命值: baseHp * 3,
      当前精神MP: baseMp * 2,
      最大精神MP: baseMp * 2,
      攻击力: Math.round(baseAtk * 1.5),
      描述: "统治该楼层的强大怪物。",
      图片: "https://images.unsplash.com/photo-1620560024765-685b306b3a0c?q=80&w=600&auto=format&fit=crop",
      等级: level + 1,
      技能: ["咆哮震慑", "重击"]
    };
  }

  const commonEnemies = [
    { name: "狗头人", desc: "如同猎犬般的人形怪物。", img: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?q=80&w=400" },
    { name: "哥布林", desc: "身材矮小但生性残忍。", img: "https://images.unsplash.com/photo-1591185854884-1d37452d3774?q=80&w=400" },
    { name: "杀人蚁", desc: "拥有坚硬甲壳的群居怪物。", img: "https://images.unsplash.com/photo-1550747528-cdb45925b3f7?q=80&w=400" },
    { name: "弥诺陶洛斯", desc: "发狂的牛头人怪物。", img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400" }
  ];

  const template = commonEnemies[Math.floor(Math.random() * commonEnemies.length)];

  return {
    id: 'enemy_' + Date.now(),
    名称: template.name,
    当前生命值: baseHp + Math.floor(Math.random() * 20),
    最大生命值: baseHp + Math.floor(Math.random() * 20),
    当前精神MP: baseMp + Math.floor(Math.random() * 10),
    最大精神MP: baseMp + Math.floor(Math.random() * 10),
    攻击力: baseAtk,
    描述: template.desc,
    图片: template.img,
    等级: level,
    技能: ["突袭", "连击"]
  };
};

// --- 地错世界地点结构（简化版） ---
export const generateDanMachiMap = (): WorldMapData => {
  return {
    macroLocations: [
      {
        id: 'macro_lower',
        名称: '下界',
        地点: '下界',
        描述: '众神降临后的人类世界。',
        内容: ['欧拉丽', '拉基亚王国', '特尔斯库拉', '梅伦']
      }
    ],
    midLocations: [
      {
        id: 'mid_orario',
        名称: '欧拉丽',
        描述: '迷宫都市，地下城入口位于巴别塔之下。',
        归属: '下界',
        内部建筑: [
          '巴别塔广场',
          '公会本部',
          '丰饶的女主人',
          '废弃教堂',
          '赫菲斯托丝眷族工房'
        ]
      }
    ],
    smallLocations: [
      {
        id: 'small_guild_hall',
        名称: '公会大厅',
        归属: '公会本部',
        描述: '冒险者登记与任务接取的主要区域。'
      },
      {
        id: 'small_babel_square',
        名称: '巴别塔广场',
        归属: '欧拉丽',
        描述: '巴别塔入口前的广场，人流密集。'
      },
      {
        id: 'small_hostess_main',
        名称: '丰饶的女主人·大厅',
        归属: '丰饶的女主人',
        描述: '酒馆大厅，冒险者聚集地。'
      }
    ],
    current: {
      macroId: 'macro_lower',
      midId: 'mid_orario'
    }
  };
};

const matchByName = (name: string, list: { 名称?: string; 地点?: string }[]) =>
  list.find(item => item.名称 === name || item.地点 === name);

export const resolveLocationHierarchy = (
  mapData: WorldMapData | undefined,
  locationName?: string
): { macro?: string; mid?: string; small?: string } => {
  if (!mapData) return {};

  const currentMacro = mapData.current?.macroId
    ? mapData.macroLocations.find(m => m.id === mapData.current?.macroId)
    : undefined;
  const currentMid = mapData.current?.midId
    ? mapData.midLocations.find(m => m.id === mapData.current?.midId)
    : undefined;
  const currentSmall = mapData.current?.smallId
    ? mapData.smallLocations.find(m => m.id === mapData.current?.smallId)
    : undefined;

  let macro = currentMacro?.地点 || currentMacro?.名称;
  let mid = currentMid?.名称;
  let small = currentSmall?.名称;

  if (!locationName) return { macro, mid, small };

  const smallHit = matchByName(locationName, mapData.smallLocations);
  if (smallHit) {
    small = smallHit.名称;
    if (smallHit.归属) {
      const midHit = matchByName(smallHit.归属, mapData.midLocations);
      if (midHit) {
        mid = midHit.名称;
        macro = midHit.归属 || macro;
      } else {
        mid = smallHit.归属;
      }
    }
    if (!macro && mid) {
      const midHit = matchByName(mid, mapData.midLocations);
      macro = midHit?.归属 || macro;
    }
    return { macro, mid, small };
  }

  const midHit = matchByName(locationName, mapData.midLocations);
  if (midHit) {
    mid = midHit.名称;
    macro = midHit.归属 || macro;
    return { macro, mid };
  }

  const macroHit = matchByName(locationName, mapData.macroLocations);
  if (macroHit) {
    macro = macroHit.地点 || macroHit.名称;
    return { macro };
  }

  return { macro, mid, small };
};
