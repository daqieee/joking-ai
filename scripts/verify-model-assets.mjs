import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { open, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const models = [
  {
    file: new URL('../public/models/random-num100-Q4_K_M.gguf', import.meta.url),
    bytes: 425_888,
    sha256: 'b48246d6f91055e652011868d5f468090fc299cca03d7718e99c8dacc1b3e279',
  },
  {
    file: new URL('../public/models/joking-teapot-v1-f32.gguf', import.meta.url),
    bytes: 102_016,
    sha256: 'c2518744658bed4ab9795d7e509292f76df86f1494efa4bd4df59648a9771fef',
  },
]
if (process.argv.includes('--pelican')) {
  models.push({
    file: new URL('../.model-cache/pelican-v2-Q4_K_M.gguf', import.meta.url),
    bytes: 167_846_208,
    sha256: '5d449b74def5447d236471e365c0db1e05396d7df2fd658cdff62116b9bee00a',
  })
}

// Parse only the GGUF header/metadata, not the tensor payload. Large vocabulary
// arrays are skipped, keeping inspection cheap even for the 168 MB model.
async function metadata(file) {
  const handle = await open(file, 'r')
  const buffer = Buffer.alloc(4 * 1024 * 1024)
  try {
    await handle.read(buffer, 0, buffer.length, 0)
  } finally {
    await handle.close()
  }
  let offset = 0
  const integer = (bytes = 4) => {
    const number =
      bytes === 8 ? Number(buffer.readBigUInt64LE(offset)) : buffer.readUInt32LE(offset)
    offset += bytes
    return number
  }
  const string = () => {
    const length = integer(8)
    assert.ok(offset + length <= buffer.length, 'GGUF metadata exceeds inspection buffer')
    const value = buffer.toString('utf8', offset, offset + length)
    offset += length
    return value
  }
  const value = (type) => {
    if (type === 8) return string()
    if (type === 9) {
      const elementType = integer()
      const length = integer(8)
      for (let index = 0; index < length; index++) value(elementType)
      return `array(${length})`
    }
    const readers = {
      0: ['readUInt8', 1],
      1: ['readInt8', 1],
      2: ['readUInt16LE', 2],
      3: ['readInt16LE', 2],
      4: ['readUInt32LE', 4],
      5: ['readInt32LE', 4],
      6: ['readFloatLE', 4],
      7: ['readUInt8', 1],
      10: ['readBigUInt64LE', 8],
      11: ['readBigInt64LE', 8],
      12: ['readDoubleLE', 8],
    }
    const reader = readers[type]
    assert.ok(reader, `Unsupported GGUF value type: ${type}`)
    const result = buffer[reader[0]](offset)
    offset += reader[1]
    return typeof result === 'bigint' ? Number(result) : result
  }
  assert.equal(buffer.toString('ascii', 0, 4), 'GGUF')
  offset = 4
  assert.equal(integer(), 3)
  const tensorCount = integer(8)
  const entryCount = integer(8)
  const entries = {}
  for (let index = 0; index < entryCount; index++) {
    const key = string()
    const item = value(integer())
    if (/^(general\.(?:architecture|name|file_type|license)|llama\.)/.test(key)) entries[key] = item
  }
  const layers = entries['llama.block_count']
  const heads = entries['llama.attention.head_count_kv']
  const keyLength = entries['llama.attention.key_length']
  const valueLength = entries['llama.attention.value_length']
  const kv =
    layers && heads && keyLength && valueLength
      ? {
          context: 32_768,
          // q8_0: 32 int8 values + one 2-byte f16 block scale.
          f16Bytes: 32_768 * layers * heads * (keyLength + valueLength) * 2,
          q8_0Bytes: (32_768 * layers * heads * (keyLength + valueLength) * 34) / 32,
          excludes: 'weights, compute buffers, WASM, JavaScript and browser overhead',
        }
      : undefined
  return { tensorCount, entries, ...(kv ? { kvCacheAt32K: kv } : {}) }
}

for (const model of models) {
  assert.equal((await stat(model.file)).size, model.bytes, `Wrong file size: ${model.file}`)
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(model.file)) hash.update(chunk)
  assert.equal(hash.digest('hex'), model.sha256, `SHA-256 mismatch: ${model.file}`)
  console.log(
    JSON.stringify({
      file: fileURLToPath(model.file),
      bytes: model.bytes,
      sha256: model.sha256,
      ...(await metadata(model.file)),
    }),
  )
}
