export const ANIMAL_MODELS = {
  guppy: {
    repo: 'arman-bd/guppylm-9M',
    revision: '5f09d63fae6f5049bd2360d690f01b68a63d837b',
    bytes: 10469869,
    tokenizerBytes: 160605,
    context: 128,
    maxPromptTokens: 64,
    maxNewTokens: 64,
    sha256: '96dd79d233662b65bc0fae1773821479551d1c1257ca5bbd12fa3e6623ae4835',
    tokenizerSha256: 'b03b0b94a723f4c6757a39836f2755adb5a240e40017b089ba1820f51da6c92a',
    externalDataSha256: '',
    externalData: false,
  },
  miso: {
    repo: 'phruut/meowllm-onnx',
    revision: '9697a86134592e88e433f77d31f4e4498ef6eba4',
    bytes: 14283135,
    tokenizerBytes: 100761,
    context: 256,
    maxPromptTokens: 160,
    maxNewTokens: 60,
    sha256: 'c6e0902dd9d6c453e842573c6d64779f76f93f2d05eeaf5d0b69a61e31a8236d',
    tokenizerSha256: '874f76a917ca3ccba0fe7253bb08688df0d977a5e1a423ccc27c419c093a4332',
    externalDataSha256: '0a370100163f43d0f893c7bf47ff8e9c9267dc6790e8fb3fa080c6669320167d',
    externalData: true,
  },
} as const
export type AnimalModelId = keyof typeof ANIMAL_MODELS
export function isAnimalModelId(id: string): id is AnimalModelId {
  return Object.hasOwn(ANIMAL_MODELS, id)
}
export function animalAssetUrl(id: AnimalModelId, file: string) {
  const model = ANIMAL_MODELS[id]
  return `https://huggingface.co/${model.repo}/resolve/${model.revision}/${file}`
}
