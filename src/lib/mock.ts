import { getModel, getReasoning, getReasoningLevels } from '../config/models'
import type { ReasoningId, ReplyResult, SimulationStage } from '../types'
import pelicanPreset from '../assets/pelican.html?raw'

export const MAX_MESSAGE_LENGTH = 4000

export function summarizeTopic(input: string): string {
  const normalized = input.trim().replace(/\s+/g, ' ')
  const characters = Array.from(normalized)
  return characters.length > 44 ? `${characters.slice(0, 44).join('')}…` : normalized
}

/** Rejection sampling avoids the bias from mapping all 2^32 values with % 101. */
export function secureRandomNumber(
  fill: (values: Uint32Array) => void = (values) => {
    crypto.getRandomValues(values)
  },
): number {
  const values = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / 101) * 101
  do {
    fill(values)
  } while (values[0] >= limit)
  return values[0] % 101
}

const PELICAN_STEPS: readonly string[][] = [
  ['简短骑行检查：头盔、车铃与鱼的梦想均已就绪。正在准备本站预设网页。'],
  [
    '骑行准备 1/3：确认头盔能容纳一位有远大理想的鸟。',
    '骑行准备 2/3：调整车座。鹈鹕表示腿短属于空气动力学设计。',
    '骑行准备 3/3：检查铃铛，优先通知沿途的鱼让行。',
  ],
  [
    '承重分析：将鹈鹕的体重分成“鹈”和“鹕”，分别送上秤。',
    '轮辐负载模拟：每根轮辐都收到了同一份加班通知。',
    '动态试骑：车轮正在旋转，工程师的眉毛也在旋转。',
    '分析结论：可以出发，建议携带一辆备用自行车给自行车减压。',
  ],
  [
    '车架体检：前叉说“我尽力”，后叉说“我也是”。',
    '结构警告：车座已将这次乘坐标记为一次大型活动。',
    '结构警告升级：轮胎申请从充气改为充勇气。',
    '模拟加固：为自行车补发一张“相信自己”的证书。',
    '安全结论：先鸣笛，再上车，给桥梁留出心理准备时间。',
  ],
  [
    '阶段一 · 需求对齐：目的地是一条河，需求方是一张嘴。',
    '阶段二 · 初选路线：最近的桥已自动退出候选名单。',
    '阶段三 · 路线复核：避开斜坡、细桥，以及容易产生误会的体重秤。',
    '阶段四 · 重新规划：将十公里捷径优化为四十公里平路。',
    '阶段五 · 补给安排：每个休息点都要有鱼，自行车则需要情绪支持。',
    '阶段六 · 执行方案：绕行成功。鹈鹕省了力，地图多了三页。',
  ],
  [
    '伪思考记录 01：首先排除“换一只瘦鹈鹕”的方案，因为客户坚持这就是最小可行鹈鹕。我们的工作是解决骑行问题，而不是与客户的食量谈判。',
    '伪思考记录 02：称重台显示“请逐位上秤”。现场只有一位鹈鹕。为避免设备尴尬，项目组将它解释为对鹈鹕人格魅力的复数表达。',
    '伪思考记录 03：车架建议召开车架会议，轮胎建议召开轮胎会议。两场会议互相等待输入，现已形成一个稳定但不能骑走的协作闭环。',
    '伪思考记录 04：重新规划路线，绕过三座桥、两块饼干和一切可能诱发额外进食的路牌。路线不是变长，只是在地球表面增加了一些慎重。',
    '伪思考记录 05：尝试把鹈鹕的质量转换成骑行热情。热情确实上升，质量也因为庆功鱼上升。实验室决定暂停庆功，鱼表示反对。',
    '临界质量警告：鹈鹕已接近自行车能够保持自行车身份的临界点。超过此点，车轮可能改名为地基，车铃可能被登记为门铃。',
    '临界质量警告升级：附近的时间开始以“饭前”和“饭后”计量。请勿继续投喂，否则导航可能把这只鸟识别为一座有迁徙意愿的小岛。',
    '最终模拟方案：将骑行速度设为从容，将承重信心设为勇敢。全体轮辐通过了“先试试再说”的决议，史诗级出发现在开始。',
  ],
]

const RANDOM_STEPS: readonly string[][] = [
  ['简短抽签仪式：请 101 个整数排好队，将选择交给浏览器随机源。'],
  [
    '阶段 1/3：请 0 到 100 排队。没有数字享有 VIP 通道。',
    '阶段 2/3：把选择交给浏览器加密随机源，本剧场负责严肃点头。',
    '阶段 3/3：数字已就位，正在为它准备一个没有解释的出场。',
  ],
  [
    '概率分析：共有 101 个整数候选，0 和 100 都持有有效入场券。',
    '分析补充：前六档使用拒绝采样，丢弃不能均匀分组的尾部，避免取模偏差。',
    '模拟评审：每个候选机会相同。数字没有递交简历，这很公平。',
    '评审结论：仪式无法改变概率，但可以延长等待。现在交付数字。',
  ],
  [
    '交叉验证 · 第一轮：检查候选范围，101 位均未越界。',
    '交叉验证 · 第二轮：请奇数审查偶数，双方都认为对方过于整齐。',
    '交叉验证 · 第三轮：请 0 检查边界，0 表示自己就是边界。',
    '交叉验证 · 第四轮：重新核对拒绝采样规则，未给任何数字开后门。',
    '模拟签字：四轮仪式完成，实际抽样仍仅由加密随机源决定。',
  ],
  [
    '量子剧场开场：以下动画仅为视觉比喻，不是量子计算。',
    '叠加态排练：101 个候选同时表示“可能是我”。',
    '观测装置校准：屏幕已经擦干净，概率没有因此改变。',
    '模拟坍缩：所有光点缓缓收束，舞台灯对准一个整数。',
    '谢幕确认：实际结果来自浏览器加密随机源，请数字登场。',
  ],
  [
    '命运推演 · 卷一：调取星图。发现星星没有为整数排序，因此撤销星图的排序权限。',
    '命运推演 · 卷二：咨询昨日的骰子。它拒绝预测今天，理由是仍在休假。',
    '命运推演 · 卷三：让 101 位候选穿过命运之门，门卫坚持逐一检查工牌。',
    '命运推演 · 卷四：所有预言互相校对，最终一致承认自己是本站撰写的舞台台词。',
    '命运推演 · 卷五：在拒绝采样之后，严肃确认结果没有承载运势、建议或宇宙的特殊安排。',
    '命运推演 · 终卷：委员会郑重封存全部解释，只把一个数字交给你。',
  ],
]

const TEAPOT_STEPS: readonly string[][] = [
  ['温水待客：茶杯已摆好，咖啡杯暂未获得营业许可。'],
  [
    '水温上升：壶盖开始轻声提醒。',
    '咖啡核验：本壶没有对应业务线。',
    '退回请求：附赠一杯想象中的温茶。',
  ],
  [
    '召集茶叶代表会议。',
    '全票通过“本壶仍是茶壶”。',
    '签发 418 号茶务通知。',
    '蒸汽打印机开始打印拒绝理由。',
  ],
  [
    '压力检测：咖啡请求令壶内茶叶集体皱眉。',
    '提交咖啡越界报告。',
    '壶嘴启动单向茶水协议。',
    '高压复核：仍然无法冲煮咖啡。',
    '请把需求转交隔壁的咖啡机。',
  ],
  [
    '锅炉超频：茶叶进入高性能模式。',
    '壶盖请求一块散热片。',
    '厨房网关将咖啡端口重定向到茶杯。',
    '检测到又一次咖啡请求，启动全厨房茶化演习。',
    '418 状态码已加热至适饮温度。',
    '超频完成，产能提升为每秒拒绝三次咖啡。',
  ],
  [
    '宇宙茶道开庭：银河只是壶嘴倒水时的一条弧线。',
    '邀请九颗想象中的茶叶行星作证。',
    '审议咖啡是否属于本宇宙服务范围。',
    '星云提交证词：这里闻起来像一壶乌龙。',
    '委员会将黑洞重新登记为深色茶杯。',
    '宇宙常数新增一条：茶壶永不承担咖啡 KPI。',
    '终审裁定 418，跨维度生效，茶水自取。',
  ],
]

export const TEAPOT_PRESET =
  '418 · 我是一把茶壶。咖啡这个需求很有想法，但本壶的产品路线里只有茶。请自备茶叶，热水管够。'
export { pelicanPreset as PELICAN_PRESET }

export function generateMockResponse(
  input: string,
  modelId: string,
  reasoningId: ReasoningId,
): ReplyResult {
  if (!input.trim()) throw new Error('请先输入一点想说的话')
  const model = getModel(modelId)
  const level = getReasoning(reasoningId, model.id)
  if (level.id === 'real') throw new Error('拟真档必须使用真实 GGUF provider')
  const index = getReasoningLevels(model.id).findIndex((item) => item.id === level.id)
  const steps = { pelican: PELICAN_STEPS, random: RANDOM_STEPS, teapot: TEAPOT_STEPS }[
    model.theatre
  ][index]
  const stage: SimulationStage = {
    simulated: true,
    kind: model.theatre,
    level: index + 1,
    steps: [...steps],
  }
  return {
    content:
      model.theatre === 'pelican'
        ? pelicanPreset
        : model.theatre === 'random'
          ? String(secureRandomNumber())
          : TEAPOT_PRESET,
    format: model.theatre === 'pelican' ? 'html' : 'text',
    provider: 'simulation',
    stage,
  }
}

export function generateMockReply(
  input: string,
  modelId: string,
  reasoningId: ReasoningId,
): string {
  return generateMockResponse(input, modelId, reasoningId).content
}
