/**
 * Reproducible, untrained, original Joking AI toy GGUF. No Python dependencies.
 * The zero-attention residual / linked-token construction was inspired by
 * lijie-gh/a-random-number-model (MIT). See THIRD_PARTY_NOTICES.md.
 * This is NOT a model or checkpoint supplied by namishsaxena/teapot-gpt.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const output = new URL('../public/models/joking-teapot-v1-f32.gguf', import.meta.url)
export const TEAPOT_RESPONSE = "418 · I'm a teapot.\n我是本站手写权重的小茶壶，只负责拒绝煮咖啡。"
const chunks = ["418 · I'm a teapot.\n", '我是本站手写权重的小茶壶，', '只负责拒绝煮咖啡。']
const dim = 32
const ff = 32
const alignment = 32
const T = { u32: 4, i32: 5, f32: 6, bool: 7, str: 8, arr: 9 }

function integer(value, bytes = 4) {
  const buffer = Buffer.alloc(bytes)
  if (bytes === 8) buffer.writeBigUInt64LE(BigInt(value))
  else buffer.writeUInt32LE(value)
  return buffer
}

function string(value) {
  const bytes = Buffer.from(value, 'utf8')
  return Buffer.concat([integer(bytes.length, 8), bytes])
}

function value(type, item) {
  if (type === T.str) return string(item)
  if (type === T.bool) return Buffer.from([Number(item)])
  if (type === T.arr) {
    const [elementType, items] = item
    return Buffer.concat([
      integer(elementType),
      integer(items.length, 8),
      ...items.map((entry) => value(elementType, entry)),
    ])
  }
  if (type === T.f32) {
    const buffer = Buffer.alloc(4)
    buffer.writeFloatLE(item)
    return buffer
  }
  return integer(item)
}

// GPT-2's byte alphabet makes generated multilingual chunks detokenize exactly.
function byteAlphabet() {
  const bytes = [
    ...Array.from({ length: 94 }, (_, i) => i + 33),
    ...Array.from({ length: 12 }, (_, i) => i + 161),
    ...Array.from({ length: 82 }, (_, i) => i + 174),
  ]
  const chars = [...bytes]
  let extra = 256
  for (let byte = 0; byte < 256; byte++) {
    if (!bytes.includes(byte)) {
      bytes.push(byte)
      chars.push(extra++)
    }
  }
  return new Map(bytes.map((byte, i) => [byte, String.fromCodePoint(chars[i])]))
}

const alphabet = byteAlphabet()
const encode = (text) => [...Buffer.from(text, 'utf8')].map((b) => alphabet.get(b)).join('')
const tokens = [
  '<unk>',
  '<s>',
  '</s>',
  ...chunks.map(encode),
  ...Array.from({ length: 256 }, (_, i) => alphabet.get(i)),
]
const vocab = tokens.length
const embeddings = new Float32Array(vocab * dim)
const logits = new Float32Array(vocab * dim)
for (let token = 0; token < vocab; token++) embeddings[token * dim] = 1
for (let index = 0; index < chunks.length; index++) {
  const token = 3 + index
  embeddings[token * dim] = 0
  embeddings[token * dim + index + 1] = 1
  logits[token * dim + index] = 8
}
logits[2 * dim + chunks.length] = 8

const kv = [
  ['general.architecture', T.str, 'llama'],
  ['general.name', T.str, 'Joking AI Teapot v1 - handcrafted, untrained'],
  [
    'general.description',
    T.str,
    'Independent Joking AI toy. Handwritten deterministic weights, no training, no general reasoning. Not an upstream TeapotGPT checkpoint.',
  ],
  ['general.license', T.str, 'mit'],
  ['general.file_type', T.u32, 0],
  ['general.alignment', T.u32, alignment],
  ['llama.context_length', T.u32, 512],
  ['llama.embedding_length', T.u32, dim],
  ['llama.block_count', T.u32, 1],
  ['llama.feed_forward_length', T.u32, ff],
  ['llama.attention.head_count', T.u32, 1],
  ['llama.attention.head_count_kv', T.u32, 1],
  ['llama.attention.key_length', T.u32, dim],
  ['llama.attention.value_length', T.u32, dim],
  ['llama.attention.layer_norm_rms_epsilon', T.f32, 1e-5],
  ['llama.rope.dimension_count', T.u32, dim],
  ['llama.rope.freq_base', T.f32, 10000],
  ['llama.vocab_size', T.u32, vocab],
  ['llama.tie_word_embeddings', T.bool, false],
  ['tokenizer.ggml.model', T.str, 'gpt2'],
  ['tokenizer.ggml.pre', T.str, 'gpt-2'],
  ['tokenizer.ggml.tokens', T.arr, [T.str, tokens]],
  ['tokenizer.ggml.token_type', T.arr, [T.i32, [2, 3, 3, ...Array(vocab - 3).fill(1)]]],
  ['tokenizer.ggml.merges', T.arr, [T.str, []]],
  ['tokenizer.ggml.bos_token_id', T.u32, 1],
  ['tokenizer.ggml.eos_token_id', T.u32, 2],
  ['tokenizer.ggml.unknown_token_id', T.u32, 0],
  ['tokenizer.ggml.add_bos_token', T.bool, true],
  ['tokenizer.ggml.add_eos_token', T.bool, false],
  ['tokenizer.chat_template', T.str, '{{ bos_token }}'],
]

const one = () => new Float32Array(dim).fill(1)
const zero = (length) => new Float32Array(length)
const tensors = [
  ['token_embd.weight', [dim, vocab], embeddings],
  ['output.weight', [dim, vocab], logits],
  ['output_norm.weight', [dim], one()],
  ['blk.0.attn_norm.weight', [dim], one()],
  ['blk.0.ffn_norm.weight', [dim], one()],
  ...['q', 'k', 'v', 'output'].map((name) => [
    `blk.0.attn_${name}.weight`,
    [dim, dim],
    zero(dim * dim),
  ]),
  ['blk.0.ffn_gate.weight', [dim, ff], zero(dim * ff)],
  ['blk.0.ffn_down.weight', [ff, dim], zero(dim * ff)],
  ['blk.0.ffn_up.weight', [dim, ff], zero(dim * ff)],
]

const info = []
const data = []
let offset = 0
for (const [name, shape, weights] of tensors) {
  const padding = (alignment - (offset % alignment)) % alignment
  data.push(Buffer.alloc(padding))
  offset += padding
  info.push(
    string(name),
    integer(shape.length),
    ...shape.map((n) => integer(n, 8)),
    integer(0),
    integer(offset, 8),
  )
  const bytes = Buffer.alloc(weights.length * 4)
  weights.forEach((weight, i) => bytes.writeFloatLE(weight, i * 4))
  data.push(bytes)
  offset += bytes.length
}

const header = Buffer.concat([
  Buffer.from('GGUF'),
  integer(3),
  integer(tensors.length, 8),
  integer(kv.length, 8),
  ...kv.map(([key, type, item]) => Buffer.concat([string(key), integer(type), value(type, item)])),
  ...info,
])
const model = Buffer.concat([
  header,
  Buffer.alloc((alignment - (header.length % alignment)) % alignment),
  ...data,
])

// Verify the real matrix transition used by the residual stream at every step.
let previous = 1
for (const expected of [3, 4, 5, 2]) {
  let winner = -1
  let largest = -Infinity
  for (let token = 0; token < vocab; token++) {
    let dot = 0
    for (let d = 0; d < dim; d++) dot += logits[token * dim + d] * embeddings[previous * dim + d]
    if (dot > largest) {
      largest = dot
      winner = token
    }
  }
  if (winner !== expected) throw new Error(`Invalid transition ${previous} -> ${winner}`)
  previous = winner
}
if (chunks.join('') !== TEAPOT_RESPONSE) throw new Error('Invalid text chunks')
const sha256 = createHash('sha256').update(model).digest('hex')
if (process.argv.includes('--check')) {
  const existing = await readFile(output)
  if (!existing.equals(model))
    throw new Error('Bundled Teapot model differs from reproducible build')
} else {
  await mkdir(new URL('../public/models/', import.meta.url), { recursive: true })
  await writeFile(output, model)
}
console.log(
  JSON.stringify({
    file: fileURLToPath(output),
    bytes: model.length,
    sha256,
    response: TEAPOT_RESPONSE,
    trained: false,
  }),
)
