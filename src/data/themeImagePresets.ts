export const themeKeys = [
  'healing-ins',
  'oriental-song',
  'glacier-crystal',
  'cream-french',
  'forest-mineral',
  'midnight-astrolabe',
  'japanese-wabi-sabi',
  'aegean-sea-salt',
  'desert-terracotta',
  'moonlit-pearl',
  'morandi-gallery',
  'monochrome-museum',
] as const

export type ThemeKey = (typeof themeKeys)[number]

export interface ThemeSlideCopy {
  eyebrow: string
  title: string
  description: string
}

export interface ThemeImagePreset {
  siteTitleLogoImage: string
  launchBackgroundImage: string
  wristMeasurementImage: string
  customerServiceFloatImage: string
  slides: readonly string[]
  slideCopy: readonly ThemeSlideCopy[]
  mainEntries: Readonly<Record<'handcraft' | 'finished-style', string>>
  shortcuts: Readonly<Record<'inspiration-atlas' | 'cart' | 'orders' | 'my-designs', string>>
  homeProcessImage: string
  homeActivityImage: string
  mallHeroImage: string
  diyShowcaseCopy: ThemeSlideCopy
}

/**
 * Theme image URLs are deliberately bundled into the management frontend.
 * Changing the theme only copies a preset into the unsaved settings form.
 */
export const themeImagePresets = {
  "healing-ins": {
    "siteTitleLogoImage": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521471209_fa3abaaa8cb4.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206803740_f8738a7bfb09.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786256976367_34a0780fbd4b.jpg",
    "customerServiceFloatImage": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521475208_fb8361dacbd3.png",
    "slides": [
      "https://rocking.synology.me:3000/uploads/images/assets/2026/07/image_1785080208447_131dfcaaffda.jpg",
      "https://rocking.synology.me:3000/uploads/images/assets/2026/07/image_1785080213915_c61c6f955c3b.jpg",
      "https://rocking.synology.me:3000/uploads/images/assets/2026/07/image_1785080217559_6026aa9add0d.jpg",
      "https://rocking.synology.me:3000/uploads/images/assets/2026/07/image_1785080221014_113d6785a296.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "MORNING NOTE · 今日推荐", "title": "碰撞重构 色彩工坊", "description": "打通玻璃、金属与原石的材质边界，创作属于你的绚丽色彩。" },
      { "eyebrow": "SOFT BLOOM · 柔和能量", "title": "光泽流转 珍珠篇章", "description": "精选异形天然淡水珍珠，赋予肌肤温润优雅的细腻光泽。" },
      { "eyebrow": "QUIET NIGHT · 好眠能量", "title": "定义你的 专属串珠", "description": "从自然肌理中寻找灵感，由我们的工匠为您打造独一无二的佩饰" },
      { "eyebrow": "GENTLE GROUND · 安定能量", "title": "稳稳地，回到自己", "description": "苔藓玛瑙与白水晶，把心安放在当下" }
    ],
    "mainEntries": {
      "handcraft": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521381713_89642c08ee91.jpg",
      "finished-style": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521392991_b277a9bece7d.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521426333_508083da2fc9.jpg",
      "cart": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521433743_2df872aa564f.jpg",
      "orders": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521438736_9953c8fbafe9.jpg",
      "my-designs": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521442278_d59f0820b7dc.jpg"
    },
    "homeProcessImage": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521455560_23ae9a8ac960.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1785862284008_03244be81498.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1785862289295_101615b5d7f1.jpg",
    "diyShowcaseCopy": { "eyebrow": "MY CRYSTAL · 今日作品", "title": "把喜欢的光，串成日常", "description": "一串一念，留住此刻的温柔。" }
  },
  "oriental-song": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176875151_c08b31126191.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206804651_849813dfd0a2.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257090721_85e14066ce0d.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176875843_851f7d796ffa.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176876307_fbb0b7bbee68.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176876843_dcfe46340ecb.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176877309_29b660b99b13.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176877776_9181885b1dca.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "SONG · 清供雅集", "title": "一腕清雅，静见东方", "description": "青瓷、白玉与淡墨色相遇，留下宋式留白与从容。" },
      { "eyebrow": "TEA MIST · 茶烟入玉", "title": "温润如玉，自有风骨", "description": "取茶色与月白入串，在克制色泽间收藏东方气韵。" },
      { "eyebrow": "RED SEAL · 一点朱砂", "title": "素色之中，点一笔红", "description": "以朱砂色作小小落款，让安静作品多一份笃定心意。" },
      { "eyebrow": "PAPER MOON · 纸上月色", "title": "把山水，收进腕间", "description": "烟青、黛色与清透水晶，像一幅可佩戴的微型山水。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176878264_85b2d4c683f3.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176878772_ebbbaeb8bfac.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176879251_928550423459.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176879727_e58865d0a4c6.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176880202_dde86a18e28b.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176880667_630998601874.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176881156_924f9e8567ba.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176881621_b5a99c5ffc45.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176882082_5df877f19a5c.jpg",
    "diyShowcaseCopy": { "eyebrow": "ORIENTAL PIECE · 今日雅作", "title": "一腕清韵，自有东方", "description": "以青瓷、月白与淡墨色入串，把含蓄心意留在日常。" }
  },
  "glacier-crystal": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176883035_bd5c04d7b9bf.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206805260_c6fb58c66778.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257090990_4ebbd969db44.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176883530_3f871ebd70d5.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176884036_b7a619255c50.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176884553_36dc6d7a2573.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176885045_f74f10cc882b.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176885540_8b5e6e48a3a7.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "ICE LIGHT · 冰川初醒", "title": "清透，像晨光落雪", "description": "冰蓝水晶与银白光泽交叠，让心绪回到澄澈。" },
      { "eyebrow": "AURORA · 极光微澜", "title": "把一束冷光戴上", "description": "淡紫与雾蓝缓慢流动，在腕间留下极光般的层次。" },
      { "eyebrow": "CLEAR AIR · 纯净呼吸", "title": "轻一点，也更坚定", "description": "透明矿石与浅色金属，组成干净利落的日常陪伴。" },
      { "eyebrow": "FROST STAR · 霜星低语", "title": "在静谧里，听见光", "description": "冷调光泽细碎闪烁，像夜雪上安静落下的星芒。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176886036_cf53c3965e13.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176886544_ed523b09a118.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176887032_4caae0f17495.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176887534_1643f9e81c6a.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176888041_3792887dcbb5.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176888542_b3e35bd97b8c.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176889024_aa7c67347406.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176889524_9acc9325c2b6.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176890003_821f58190240.jpg",
    "diyShowcaseCopy": { "eyebrow": "CRYSTAL LIGHT · 今日作品", "title": "把冰川的光，留在腕间", "description": "清透矿石与冷色微光相遇，照见轻盈而坚定的自己。" }
  },
  "cream-french": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176908587_ac51df8a9c27.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206805895_1b45927653ee.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091071_0e5d8308494e.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176909245_585fcb4467fc.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176909718_f606bafe7931.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176910207_195e3febdccb.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176910685_12a2808ba1c4.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176911167_e1d832e2019c.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "CREME MATIN · 奶油晨光", "title": "柔软光泽，刚好优雅", "description": "奶油白与香槟金轻轻相遇，呈现不费力的法式日常。" },
      { "eyebrow": "ROSE SALON · 玫瑰客厅", "title": "把浪漫收得刚刚好", "description": "灰粉晶石搭配温润珍珠，甜美克制，不显用力。" },
      { "eyebrow": "PETIT CADEAU · 心意礼物", "title": "为重要的人，定制一份", "description": "挑选她喜欢的颜色与寓意，把祝福藏进每一颗珠子。" },
      { "eyebrow": "GOLDEN HOUR · 午后金光", "title": "旧金色里的温柔", "description": "柔和金属与蜜糖色矿石，让复古气息融进轻盈佩戴。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176911631_845a88c0f960.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176912115_c9741cb2674e.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176912583_f212158579e4.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176913077_0f02d55bca18.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176913558_13e404daac57.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176914029_30a45dfd55ff.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176914529_37121cadf51c.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176915019_8d4b4a498d80.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176915520_191fa92e1c77.jpg",
    "diyShowcaseCopy": { "eyebrow": "FRENCH MOOD · 今日作品", "title": "把浪漫，串成日常", "description": "奶油白、灰粉与香槟金轻轻相拥，温柔得恰到好处。" }
  },
  "forest-mineral": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176916486_db4cb9fc6ddb.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206806799_74a81cc380f9.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091123_020e4c2c9ff7.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176916996_51430aefe29a.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176917492_317b3b23ded7.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176917997_c956ee4a02c5.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176918491_8e12015f9d08.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176918967_c4424490d9b3.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "FOREST DAWN · 林间初醒", "title": "把自然的呼吸戴上", "description": "苔绿与木色矿石交错，像晨光穿过潮湿森林。" },
      { "eyebrow": "MOSS STONE · 苔痕矿语", "title": "每一颗，都有自然纹理", "description": "保留矿石的色差与纹路，让作品拥有独一无二的生命感。" },
      { "eyebrow": "EARTH TONE · 大地回声", "title": "沉静，也有力量", "description": "烟晶、玛瑙与铁锈色相互平衡，陪你稳稳落在当下。" },
      { "eyebrow": "WILD PATH · 野径拾光", "title": "沿着喜欢，慢慢组合", "description": "从森林色谱里挑选材质，串出属于自己的自然轨迹。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176919456_2bb702d71f52.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176919930_21b56e186ffb.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176920408_10e5b4e0d007.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176920887_e7a7251203f0.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176921385_3ce463261ed6.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176921914_f73f652408b1.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176922395_b1969c275fb7.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176922874_3957597a9a6d.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176923348_c82ae4b49768.jpg",
    "diyShowcaseCopy": { "eyebrow": "FOREST NOTE · 今日作品", "title": "循着自然，串出自己", "description": "苔绿、木色与原生矿纹交错，让每一次佩戴都靠近大地。" }
  },
  "midnight-astrolabe": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176941906_3a14e31fee4e.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206807394_03cd68ce9aae.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091172_18dd9b577e78.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176942727_da76187629d9.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176943222_a933dffe0fbd.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176943916_5d579d71de0b.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176944628_86e3e984c672.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176945351_4d2d18656c3b.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "MIDNIGHT · 星盘启幕", "title": "把夜空，戴在腕间", "description": "午夜蓝与月光银交织，开启一场安静的星际想象。" },
      { "eyebrow": "LUNAR ORBIT · 月相轨迹", "title": "循着月光，找到自己", "description": "深蓝矿石围绕银色光点，像一条只属于你的运行轨道。" },
      { "eyebrow": "GOLDEN STAR · 金星微芒", "title": "暗色里，自有光亮", "description": "旧金细节落在深色晶石之间，克制地照亮每一次举手。" },
      { "eyebrow": "SECRET WISH · 夜愿成串", "title": "把愿望交给星辰", "description": "选择象征你的色彩与能量，将心愿一颗颗排成星图。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176946078_bb4c909b8af8.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176946852_42bfe9bacc5a.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176947533_71fc9a43ed2f.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176948057_54a99e754cd2.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176948547_3f4b5da5bdfb.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176949028_7b26194885fa.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176949521_751b7a5f2e44.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176950020_75a4ee6b6980.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176950501_1f3bf8d71de7.jpg",
    "diyShowcaseCopy": { "eyebrow": "STAR CHART · 今日作品", "title": "把心愿，排成星图", "description": "午夜蓝与月光银沿腕间运行，收藏只属于你的夜色与光。" }
  },
  "japanese-wabi-sabi": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176875151_c08b31126191.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206828291_68b5a361fdf9.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091226_53c53e6173ee.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176875843_851f7d796ffa.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198894442_3fa049e34935.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198921467_89d129851ded.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198922235_5476cb0fdb6a.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198925762_dee83bba5498.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "WABI MORNING · 侘寂晨光", "title": "在不完美里，看见安静", "description": "烟晶与乳白矿石轻轻相遇，留下自然手作的温度。" },
      { "eyebrow": "MOSS TRACE · 苔痕入石", "title": "自然留下的纹理", "description": "苔灰绿与砂岩色交错，让每一颗矿石保留自己的痕迹。" },
      { "eyebrow": "CHARCOAL LIGHT · 墨石微光", "title": "深浅之间，自有秩序", "description": "克制的墨色与柔雾光泽，安静承托腕间细节。" },
      { "eyebrow": "SOFT EARTH · 柔土心绪", "title": "把温柔，落在日常", "description": "亚麻、陶土与原石色调，陪你慢下来感受当下。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198926452_a3efcb77d593.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198927157_537f479a2a6d.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198927929_508416584965.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198928751_e3d25f29e716.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198929588_ef6c12020b80.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198930347_382aabdb40a2.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176881156_924f9e8567ba.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198931056_bd6b14aab908.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198931753_04501325a3e1.jpg",
    "diyShowcaseCopy": { "eyebrow": "WABI SABI · 今日作品", "title": "让不完美的纹理，安静成为日常", "description": "一石一痕，留下自然手作的温度。" }
  },
  "aegean-sea-salt": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176883035_bd5c04d7b9bf.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206828939_39cffe1fa0df.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091277_0fe5169ec515.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176883530_3f871ebd70d5.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198948784_7b6fbd9ed667.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198949576_ba588bcfd707.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198950241_0b9d0678e330.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198950922_f29258fce86e.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "AEGEAN LIGHT · 爱琴海光", "title": "把晴朗，戴在腕间", "description": "海盐白与爱琴海蓝交叠，像晨光落在清澈海面。" },
      { "eyebrow": "SEA BREEZE · 海风轻拂", "title": "一抹海盐蓝，刚好轻盈", "description": "松石与月白矿石轻轻相碰，把海风留在日常。" },
      { "eyebrow": "COBALT TIDE · 钴蓝潮汐", "title": "深蓝与月白，清醒相遇", "description": "钴蓝色泽收住层次，在明亮留白里更显通透。" },
      { "eyebrow": "OLIVE SHADE · 橄榄树影", "title": "让心绪慢慢放晴", "description": "橄榄绿与赤陶暖色，为清爽海岸添一份自然温度。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198951615_72dd3217ed62.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198952298_494fc6a3464b.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198952963_925769517833.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198953626_e8d2e151dd4c.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198954332_21b6aeaa009d.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198955016_ee74ddecaa72.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176889024_aa7c67347406.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198955740_24534f665bb8.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198956442_f3602ac0e001.jpg",
    "diyShowcaseCopy": { "eyebrow": "AEGEAN LIGHT · 今日作品", "title": "把海风与日光，串进轻盈日常", "description": "一抹海盐蓝，留住晴朗心绪。" }
  },
  "desert-terracotta": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176908587_ac51df8a9c27.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206829862_24dd086bb878.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091326_43278f24d61d.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176909245_585fcb4467fc.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198957141_c92755f83f53.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198957805_ac3b40558e6c.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198958514_75f49550e308.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198959194_ec1d289754b6.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "DESERT DAWN · 沙丘初光", "title": "把旷野的暖意，收进掌心", "description": "赤陶与琥珀色矿石映着晨光，温暖也有力量。" },
      { "eyebrow": "GOLDEN DUNE · 金色沙脊", "title": "温暖，也有坚定力量", "description": "沙金与烟晶顺着纹理排列，留下大地的从容。" },
      { "eyebrow": "SAGE WIND · 鼠尾草风", "title": "在大地色里，慢慢安定", "description": "鼠尾草绿平衡赤陶暖色，让心绪回到宽阔旷野。" },
      { "eyebrow": "CLAY BLOOM · 赤陶花影", "title": "一抹暖红，点亮日常", "description": "天然矿纹与陶土质感相遇，串出自由明快的节奏。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198959937_9c7b3b03dbcc.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198960631_c5528b2bc029.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198961296_87cf189acafa.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198961980_e89eada6727b.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198962670_d5a35bc7bf90.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198963336_7c04943a81d4.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176914529_37121cadf51c.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198964018_8c439148a614.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198964717_525bb530f001.jpg",
    "diyShowcaseCopy": { "eyebrow": "DESERT CLAY · 今日作品", "title": "把旷野的暖意，收进掌心", "description": "赤陶与矿石，串起有温度的自由。" }
  },
  "moonlit-pearl": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176883035_bd5c04d7b9bf.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206830431_a683f158e125.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091377_b73c38c0105b.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176883530_3f871ebd70d5.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198975515_c73bbdceacb7.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198976331_81d8e152a3fa.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198977022_bc88cdc057e2.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198977688_84325e8cca17.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "PEARL GLOW · 珠光初醒", "title": "把温柔月色，戴在腕间", "description": "珍珠白与雾紫微光交叠，细腻映亮每一次举手。" },
      { "eyebrow": "LILAC MIST · 雾紫轻落", "title": "柔光流转，安静闪耀", "description": "淡紫晶石与柔白珍珠相遇，像月色穿过薄雾。" },
      { "eyebrow": "SHELL PINK · 贝母粉光", "title": "细腻光泽，轻轻靠近", "description": "贝母粉与银灰色泽缓慢流动，温柔而不甜腻。" },
      { "eyebrow": "DOVE NIGHT · 鸽灰夜色", "title": "克制微光，自有分寸", "description": "鸽灰与珠光白收住层次，让闪耀保持安静。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198978424_94cf6240fbd7.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198979170_8f2788e50bf5.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198979897_3b5a51e17e2a.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198980619_9da43941e90a.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198981353_57001680b582.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198982116_d99e6aa83db3.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176889024_aa7c67347406.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198982830_f6ca6bcee254.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198983580_ac5849af39ea.jpg",
    "diyShowcaseCopy": { "eyebrow": "PEARL MOON · 今日作品", "title": "把温柔月色，戴在腕间", "description": "珠光轻落，陪你安静闪耀。" }
  },
  "morandi-gallery": {
    "siteTitleLogoImage": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521471209_fa3abaaa8cb4.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206831370_b698381fdb3a.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091427_797a9c593e08.jpg",
    "customerServiceFloatImage": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521475208_fb8361dacbd3.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198984404_ab620d3a704e.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198985204_d75debb5ed73.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198985918_185d503e372d.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198986629_8cb1f19ad877.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "SAGE STUDY · 鼠尾草习作", "title": "让低饱和，留住呼吸", "description": "鼠尾草绿与灰白矿石相遇，像一幅安静的色彩习作。" },
      { "eyebrow": "DUSTY ROSE · 灰粉展陈", "title": "温柔色彩，不必喧哗", "description": "灰粉色泽轻轻落下，用克制层次讲述柔软心绪。" },
      { "eyebrow": "SLATE BLUE · 灰蓝构成", "title": "把冷静与柔软放在一起", "description": "灰蓝、米白与矿物纹理排列出清晰而舒展的秩序。" },
      { "eyebrow": "COLOR BALANCE · 色彩平衡", "title": "每一种情绪，都有位置", "description": "低饱和色块彼此平衡，让灵感在留白里慢慢发生。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198987389_03216ccb0709.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198988130_419c28340a93.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198988934_0d1c24b9f24c.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198989622_1f10437327eb.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198990348_c0ab06e9b5ec.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198991211_f5374288966d.jpg"
    },
    "homeProcessImage": "https://rocking.synology.me:3000/uploads/images/assets/2026/08/image_1785521455560_23ae9a8ac960.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198991932_8ae15247fb02.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786198992660_1e8a57f1ff43.jpg",
    "diyShowcaseCopy": { "eyebrow": "MORANDI GALLERY · 今日作品", "title": "让克制色彩，讲述你的灵感", "description": "低饱和的每一颗，都有自己的情绪。" }
  },
  "monochrome-museum": {
    "siteTitleLogoImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176875151_c08b31126191.jpg",
    "launchBackgroundImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786206831962_d4d096f7152a.jpg",
    "wristMeasurementImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786257091479_171aa6b15b3b.jpg",
    "customerServiceFloatImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176875843_851f7d796ffa.png",
    "slides": [
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199001550_054a11ef1ffd.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199002298_578f24e08faa.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199002992_e2ee2d04ca11.jpg",
      "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199003730_34ef2d05331e.jpg"
    ],
    "slideCopy": [
      { "eyebrow": "MONO FORM · 黑白构成", "title": "让材质与轮廓，成为主角", "description": "黑白矿石与清晰留白相遇，呈现纯粹的形态关系。" },
      { "eyebrow": "SILVER LINE · 银色边界", "title": "清晰、克制，也有光", "description": "银灰细节勾勒轮廓，让冷静结构保持细腻光泽。" },
      { "eyebrow": "STONE CONTRAST · 石色对照", "title": "黑白之间，看见矿石纹理", "description": "深浅材质彼此衬托，把天然纹理放到视觉中心。" },
      { "eyebrow": "PURE SHAPE · 纯粹形态", "title": "去掉喧闹，只留下本真", "description": "用最少色彩整理节奏，让每一颗石头清楚表达。" }
    ],
    "mainEntries": {
      "handcraft": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199004454_7c1f1a9f18f9.jpg",
      "finished-style": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199005206_0f11afbdc851.jpg"
    },
    "shortcuts": {
      "inspiration-atlas": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199006010_d430b0054ce1.jpg",
      "cart": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199006796_6481e5e6097d.jpg",
      "orders": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199007513_6ef05d3551a8.jpg",
      "my-designs": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199008300_132e25e7bea0.jpg"
    },
    "homeProcessImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786176881156_924f9e8567ba.jpg",
    "homeActivityImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199009000_c9c2c7d5bc16.jpg",
    "mallHeroImage": "https://yunxiyue-miniapp-v2.oss-cn-heyuan.aliyuncs.com/diy/assets/2026/08/image_1786199009732_328c35dc7242.jpg",
    "diyShowcaseCopy": { "eyebrow": "MONOCHROME EDIT · 今日作品", "title": "让材质与轮廓，成为主角", "description": "去掉喧闹，只留下矿石本身的光。" }
  }
} satisfies Record<ThemeKey, ThemeImagePreset>

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === 'string' && (themeKeys as readonly string[]).includes(value)
}
