import type { ModelDefinition, ReasoningId, ReasoningLevel } from '../types'

export const MODELS: readonly ModelDefinition[] = [
  {
    id: 'pelican-pro',
    name: '鹈鹕 PRO',
    version: 'v2',
    subtitle: '一只鹈鹕，挑战自行车的极限。',
    description:
      '六档假装推理的骑行剧场，结尾展示同一份本站预设网页；拟真档下载原项目 GGUF，在浏览器里生成鹈鹕 HTML。',
    tag: '骑行剧场 · 静态网页',
    icon: 'bird',
    tone: 'sage',
    thinking: '正在为鹈鹕预约自行车',
    theatre: 'pelican',
    localModel: {
      size: '约 168 MB',
      provenance: '原项目 GGUF · Q4_K_M',
      description:
        '首次发送下载 167,846,208 字节，随后在浏览器 CPU 上运行。专用模型使用固定短提示，忽略输入。运行另占大量内存；完整 HTML 生成可能很久，建议使用桌面浏览器。',
    },
  },
  {
    id: 'random-number',
    name: '随机数模型',
    version: 'v1',
    subtitle: '想得越离谱，答案越像一个数字。',
    description:
      '六档假装推理的随机仪式，最终只交付 0～100 的一个数字；拟真档实际运行原项目微型 GGUF。',
    tag: '数字很少 · 仪式很多',
    icon: 'dice',
    tone: 'lavender',
    thinking: '正在给随机事件安排流程',
    theatre: 'random',
    localModel: {
      size: '约 426 KB',
      provenance: '原项目 GGUF · Q4_K_M',
      description:
        '首次发送下载 425,888 字节，在浏览器里实际前向计算、采样数字。前六档使用浏览器加密随机源与拒绝采样，舞台话术均为模拟。',
    },
  },
  {
    id: 'teapot-gpt',
    name: 'TeapotGPT',
    version: '418',
    subtitle: '只泡茶。咖啡请求已被壶嘴驳回。',
    description:
      '从温水到宇宙茶道，六档假装推理后交付同一份预设 418 回复。拟真档运行本站自制微型 GGUF，并非原项目模型。',
    tag: '茶水供应 · 咖啡退回',
    icon: 'teapot',
    tone: 'peach',
    thinking: '正在核验请求中的咖啡因',
    theatre: 'teapot',
    localModel: {
      size: '约 102 KB',
      provenance: '本站自制 GGUF · 非原项目模型',
      description:
        '本站独立手写权重的微型模型，未训练、不具备语义理解；拟真档通过 wllama 实际前向计算，输出 418。首次发送加载 102,016 字节。',
    },
  },
]

const LEVEL_IDS: readonly ReasoningId[] = [
  'low',
  'medium',
  'high',
  'extra',
  'extreme',
  'absurd',
  'real',
]

function theatreLevels(
  names: readonly string[],
  descriptions: readonly string[],
): readonly ReasoningLevel[] {
  return LEVEL_IDS.map((id, index) => ({
    id,
    name: names[index],
    description: descriptions[index],
    detail: index === 6 ? '真实 GGUF' : `模拟 ${index + 1} 档`,
    points: index + 1,
    delay: [600, 1450, 2200, 2900, 3700, 4900, 0][index],
  }))
}

const MODEL_REASONING_LEVELS: Readonly<Record<string, readonly ReasoningLevel[]>> = {
  'pelican-pro': theatreLevels(
    ['瘦', '中', '肥', '很肥', '特别肥', '超级无敌肥', '拟真'],
    [
      '简短骑行检查，准备预设网页',
      '检查头盔，展示骑行准备',
      '承重分析，轮辐开始认真工作',
      '自行车结构警告，车架申请发言',
      '多阶段规划，重新选择骑行路线',
      '长篇夸张伪思考，临界质量警告',
      '下载约 168 MB GGUF，实际生成 HTML',
    ],
  ),
  'random-number': theatreLevels(
    ['随机', '很随机', '极其随机', '绝对随机', '量子随机', '命运的骰子', '拟真'],
    [
      '简短抽签仪式，交付一个数字',
      '两到三个郑重其事的模拟阶段',
      '一本正经地分析等概率这件事',
      '多轮交叉验证，仪式感拉满',
      '模拟量子态坍缩动画',
      '严肃推演命运，最终仍只有数字',
      '加载约 426 KB GGUF，实际生成数字',
    ],
  ),
  'teapot-gpt': theatreLevels(
    ['温水', '微沸', '沸腾', '高压', '锅炉超频', '宇宙茶道', '拟真'],
    [
      '礼貌确认：本壶只会泡茶',
      '壶盖微动，咖啡请求原路退回',
      '召开茶叶会议，正式签发 418',
      '压力上升，提交咖啡越界报告',
      '烧水超频，触发全厨房茶化',
      '宇宙茶道委员会驳回咖啡存在',
      '本站手写、未训练的微型 GGUF',
    ],
  ),
}

export const DEFAULT_MODEL_ID = MODELS[0].id
export const DEFAULT_REASONING_ID: ReasoningId = 'medium'
export const findModel = (id: string) => MODELS.find((model) => model.id === id)
export const getModel = (id: string) => findModel(id) ?? MODELS[0]
export const getReasoningLevels = (modelId = DEFAULT_MODEL_ID): readonly ReasoningLevel[] =>
  MODEL_REASONING_LEVELS[getModel(modelId).id]
export const getReasoning = (id: string, modelId = DEFAULT_MODEL_ID): ReasoningLevel => {
  const levels = getReasoningLevels(modelId)
  return levels.find((level) => level.id === id) ?? levels[1]
}
