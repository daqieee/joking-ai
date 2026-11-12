// Real ONNX WASM inference with hash-verified weights in ANIMAL_MODEL_CACHE.
// This is a Node runtime check, not a browser/CORS acceptance test.
import * as ort from 'onnxruntime-web/wasm'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { createHash } from 'node:crypto'
const cache = process.env.ANIMAL_MODEL_CACHE || '/tmp'
const source = await fs.readFile(
  new URL('../src/lib/inference/animal-tokenizer.ts', import.meta.url),
  'utf8',
)
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { AnimalTokenizer } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
)
const hashes = {
  'guppylm-9M-model.onnx': '96dd79d233662b65bc0fae1773821479551d1c1257ca5bbd12fa3e6623ae4835',
  'miso-model.onnx': 'c6e0902dd9d6c453e842573c6d64779f76f93f2d05eeaf5d0b69a61e31a8236d',
  'miso-model.onnx.data': '0a370100163f43d0f893c7bf47ff8e9c9267dc6790e8fb3fa080c6669320167d',
  'guppylm-9M-tokenizer.json': 'b03b0b94a723f4c6757a39836f2755adb5a240e40017b089ba1820f51da6c92a',
  'meowllm-onnx-tokenizer.json': '874f76a917ca3ccba0fe7253bb08688df0d977a5e1a423ccc27c419c093a4332',
}
for (const [file, hash] of Object.entries(hashes))
  assert.equal(
    createHash('sha256')
      .update(await fs.readFile(`${cache}/${file}`))
      .digest('hex'),
    hash,
  )

ort.env.wasm.numThreads = 1
const fixtures = JSON.parse(
  await fs.readFile(new URL('./animal-tokenizer-fixtures.json', import.meta.url), 'utf8'),
)
for (const id of ['guppy', 'miso']) {
  const tok = new AnimalTokenizer(
    JSON.parse(
      await fs.readFile(
        id === 'guppy'
          ? `${cache}/guppylm-9M-tokenizer.json`
          : `${cache}/meowllm-onnx-tokenizer.json`,
        'utf8',
      ),
    ),
  )
  for (const item of fixtures[id]) {
    if (id === 'guppy' && item.text.includes('café')) continue
    assert.deepEqual(tok.encode(item.text), item.ids)
    assert.equal(tok.decode(item.ids), item.decoded)
  }
  console.log(id, 'tokenizer parity passed')
  const bytes = await fs.readFile(
    id === 'guppy' ? `${cache}/guppylm-9M-model.onnx` : `${cache}/miso-model.onnx`,
  )
  const session = await ort.InferenceSession.create(bytes, {
    executionProviders: ['wasm'],
    externalData:
      id === 'miso'
        ? [{ path: 'model.onnx.data', data: await fs.readFile(`${cache}/miso-model.onnx.data`) }]
        : undefined,
  })
  const prompt = 'are you hungry'
  const ids =
    id === 'guppy'
      ? tok.encode(`<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`)
      : [1, 3, ...tok.encode(prompt), 4]
  const output = []
  for (let n = 0; n < 60; n++) {
    const input = new ort.Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length])
    const out = await session.run({ input_ids: input })
    const logits = out.logits.data.slice(-out.logits.dims.at(-1))
    let next = 0
    for (let i = 1; i < logits.length; i++) if (logits[i] > logits[next]) next = i
    input.dispose()
    Object.values(out).forEach((t) => t.dispose())
    if (next === 2) break
    ids.push(next)
    output.push(next)
  }
  console.log(id, tok.decode(output))
  await session.release()
}
