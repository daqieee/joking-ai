/** The two upstream tokenizers use GPT-2 ByteLevel pretokenization + ranked BPE. */
export interface AnimalTokenizerData {
  model: { vocab: Record<string, number>; merges: (string | [string, string])[] }
  added_tokens: { id: number; content: string; special: boolean }[]
}
export class AnimalTokenizer {
  private readonly byteChars: string[] = []
  private readonly charBytes = new Map<string, number>()
  private readonly ranks = new Map<string, number>()
  private readonly tokens = new Map<number, string>()
  constructor(private readonly data: AnimalTokenizerData) {
    const bytes = Array.from({ length: 256 }, (_, i) => i).filter(
      (i) => (i >= 33 && i <= 126) || (i >= 161 && i <= 172) || i >= 174,
    )
    let extra = 0
    for (let i = 0; i < 256; i++) {
      const char = String.fromCodePoint(bytes.includes(i) ? i : 256 + extra++)
      this.byteChars[i] = char
      this.charBytes.set(char, i)
    }
    data.model.merges.forEach((pair, rank) =>
      this.ranks.set(typeof pair === 'string' ? pair : pair.join(' '), rank),
    )
    Object.entries(data.model.vocab).forEach(([token, id]) => this.tokens.set(id, token))
  }
  encode(text: string): number[] {
    const special = this.data.added_tokens.filter((t) => t.special)
    const escaped = special.map((t) => t.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const chunks = text.split(new RegExp(`(${escaped.join('|')})`, 'u'))
    const ids: number[] = []
    for (const chunk of chunks) {
      const token = special.find((t) => t.content === chunk)
      if (token) {
        ids.push(token.id)
        continue
      }
      const words =
        chunk.match(
          /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu,
        ) ?? []
      for (const word of words) {
        const pieces = Array.from(new TextEncoder().encode(word), (b) => this.byteChars[b])
        while (pieces.length > 1) {
          let best = Infinity
          let index = -1
          for (let i = 0; i < pieces.length - 1; i++) {
            const rank = this.ranks.get(`${pieces[i]} ${pieces[i + 1]}`) ?? Infinity
            if (rank < best) {
              best = rank
              index = i
            }
          }
          if (index < 0) break
          pieces.splice(index, 2, pieces[index] + pieces[index + 1])
        }
        for (const piece of pieces) {
          const id = this.data.model.vocab[piece]
          if (id === undefined) throw new Error('模型词表不支持这段输入，请使用简短英文。')
          ids.push(id)
        }
      }
    }
    return ids
  }
  decode(ids: number[]): string {
    const text = ids
      .filter((id) => !this.data.added_tokens.some((t) => t.id === id && t.special))
      .map((id) => this.tokens.get(id) ?? '')
      .join('')
    return new TextDecoder().decode(
      Uint8Array.from(Array.from(text, (c) => this.charBytes.get(c) ?? 32)),
    )
  }
}
