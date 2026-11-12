export const PROMPT_SETS = [
  [
    {
      category: '鹈鹕出发',
      text: '请展示鹈鹕骑自行车的网页',
      modelId: 'pelican-pro',
      icon: 'bird',
      tone: 'sand',
    },
    {
      category: '命运抽签',
      text: '给我一个 0 到 100 的数字',
      modelId: 'random-number',
      icon: 'dice',
      tone: 'lavender',
    },
    {
      category: '茶壶营业',
      text: 'TeapotGPT，可以帮我煮咖啡吗？',
      modelId: 'teapot-gpt',
      icon: 'coffee',
      tone: 'rose',
    },
    { category: '模拟剧场', text: '今天的整活仪式可以有多认真？', icon: 'orbit', tone: 'blue' },
  ],
  [
    {
      category: '骑行挑战',
      text: '这辆自行车能载动一只很有分量的鹈鹕吗？',
      modelId: 'pelican-pro',
      icon: 'bird',
      tone: 'sand',
    },
    {
      category: '随机仪式',
      text: '请郑重其事地抽取一个整数',
      modelId: 'random-number',
      icon: 'dice',
      tone: 'lavender',
    },
    {
      category: '茶水供应',
      text: '那就来一壶宇宙级乌龙茶',
      modelId: 'teapot-gpt',
      icon: 'coffee',
      tone: 'rose',
    },
    { category: '脑洞开场', text: '请把平凡小事演成一场盛大的仪式', icon: 'orbit', tone: 'blue' },
  ],
  [
    {
      category: '摸鱼助手 · 英文',
      text: 'Can you help me do absolutely nothing today?',
      modelId: 'acedia',
      icon: 'moon',
      tone: 'lavender',
    },
    {
      category: '鱼缸来信 · 英文',
      text: 'are you hungry',
      modelId: 'guppy',
      icon: 'fish',
      tone: 'blue',
    },
    {
      category: '猫猫上线 · 英文',
      text: 'Miso, can I sit in your box?',
      modelId: 'miso',
      icon: 'cat',
      tone: 'rose',
    },
    {
      category: '真实小模型',
      text: '这些小模型的脑回路可以有多离谱？',
      icon: 'orbit',
      tone: 'sand',
    },
  ],
] as const
