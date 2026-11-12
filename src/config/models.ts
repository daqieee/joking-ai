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
    upstream: {
      url: 'https://huggingface.co/0v0ai/0u0-pelican-pro-0.2B-GGUF',
      license: 'Apache-2.0',
    },
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
    upstream: {
      url: 'https://github.com/lijie-gh/a-random-number-model',
      license: 'MIT',
    },
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
    upstream: {
      url: 'https://github.com/namishsaxena/teapot-gpt',
      license: 'MIT',
    },
    localModel: {
      size: '约 102 KB',
      provenance: '本站自制 GGUF · 非原项目模型',
      description:
        '本站独立手写权重的微型模型，未训练、不具备语义理解；拟真档通过 wllama 实际前向计算，输出 418。首次发送加载 102,016 字节。',
    },
  },
  {
    id: 'acedia',
    name: 'Acedia 摸鱼助手',
    version: '135M',
    subtitle: '努力是不可能努力的，回答全凭自信。',
    description:
      '真正微调过的懒散小模型。六档是本站摸鱼预设，拟真档运行上游 135M GGUF；英文优先，答案不可靠，仅供娱乐。',
    tag: '摸鱼专业 · 自信胡说',
    icon: 'sleepy',
    tone: 'lavender',
    thinking: '正在申请把这个问题交给明天',
    theatre: 'acedia',
    upstream: { url: 'https://huggingface.co/embeputer/acedia-1-gguf', license: 'Apache-2.0' },
    localModel: {
      size: '约 105 MB',
      runtime: 'GGUF',
      provenance: '上游微调模型 · Q4_K_M',
      description:
        '首次加载 105,453,984 字节，浏览器 CPU 推理。英文优先，每次最多 600 个字符，只处理本轮输入，不读取聊天历史；可能胡说或重复，不能当作事实或建议。',
    },
  },
  {
    id: 'guppy',
    name: 'Guppy 小鱼',
    version: '9M',
    subtitle: '世界很大，但它只关心水和零食。',
    description:
      '真正训练的 8.7M 英文小鱼模型。六档是本站鱼缸预设，拟真档用原项目 ONNX 权重在浏览器生成短回复；不懂复杂任务。',
    tag: '鱼缸哲学 · 吐个泡泡',
    icon: 'fish',
    tone: 'sage',
    thinking: '正在把问题绕着鱼缸游一圈',
    theatre: 'guppy',
    upstream: { url: 'https://huggingface.co/arman-bd/guppylm-9M', license: 'MIT' },
    localModel: {
      size: '约 11 MB',
      runtime: 'ONNX',
      provenance: '原项目训练权重 · 量化 ONNX',
      description:
        '首次加载约 11 MB 模型与词表，另需 ONNX 运行时。请用简短小写英文，避免中文、表情和不常见标点；只处理当前输入。128 token 上下文，输入含格式最多 64 token，过长会提示缩短。可能重复或答非所问，纯属娱乐。',
    },
  },
  {
    id: 'miso',
    name: 'Miso 猫猫',
    version: '3.45M',
    subtitle: '纸箱是宇宙中心，午睡是终极目标。',
    description:
      '真正训练的微型英文猫模型，只有约 345 万参数。六档是本站猫猫预设，拟真档运行公开 ONNX 转换权重；语言能力非常有限。',
    tag: '猫生大事 · 先睡再说',
    icon: 'cat',
    tone: 'peach',
    thinking: '正在等猫从键盘上醒来',
    theatre: 'miso',
    upstream: { url: 'https://huggingface.co/hunt3rx99/meowllm', license: 'MIT' },
    localModel: {
      size: '约 14 MB',
      runtime: 'ONNX',
      provenance: 'meowllm 训练权重 · 社区 ONNX 转换',
      description:
        '首次加载约 14 MB 权重与词表，另需 ONNX 运行时；转换来源 phruut/meowllm-onnx。英文短句优先，输入会转为小写，只处理本轮输入；256 token 上下文，输入含格式最多 160 token。训练有限，可能不连贯，不能当作可靠助手。',
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
  runtime = 'GGUF',
): readonly ReasoningLevel[] {
  return LEVEL_IDS.map((id, index) => ({
    id,
    name: names[index],
    description: descriptions[index],
    detail: index === 6 ? `真实 ${runtime}` : `模拟 ${index + 1} 档`,
    points: index + 1,
    delay: [600, 1450, 2200, 2900, 3700, 4900, 0][index],
  }))
}

const MODEL_REASONING_LEVELS: Readonly<Record<string, readonly ReasoningLevel[]>> = {
  acedia: theatreLevels(
    ['歇会儿', '摸鱼', '躺平', '已读不回', '甩锅大师', '宇宙休假', '拟真'],
    [
      '先休息，再展示预设',
      '认真地不认真工作',
      '把努力从计划里移除',
      '对消息举行已读仪式',
      '为问题寻找下一位负责人',
      '让整个宇宙替它上班',
      '下载约 105 MB，真实英文小模型',
    ],
  ),
  guppy: theatreLevels(
    ['小泡泡', '游一圈', '找零食', '鱼缸哲学', '深海会议', '宇宙鱼缸', '拟真'],
    [
      '准备一条本站鱼缸预设',
      '绕鱼缸思考一圈',
      '检查每一颗不存在的饲料',
      '认真讨论水为什么湿',
      '召集想象中的海洋代表',
      '把银河当成一条大鱼缸',
      '下载约 11 MB，真实英文小鱼模型',
    ],
    'ONNX',
  ),
  miso: theatreLevels(
    ['眯一会', '伸懒腰', '巡逻纸箱', '猫爪审核', '全屋制霸', '宇宙午睡', '拟真'],
    [
      '准备一条本站猫猫预设',
      '先伸懒腰，再假装工作',
      '检查纸箱的战略价值',
      '让爪子替大脑签字',
      '把所有键盘登记为猫床',
      '宣布银河进入午休时间',
      '下载约 14 MB，真实英文猫猫模型',
    ],
    'ONNX',
  ),
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
