export type ImageInformationResponse = {
  Descriptor: {
    mediaType: string
    digest: string
    size: number
    urls: string[] | null
    annotations: Record<string, string> | null
    data: string | null
    platform: {
      architecture: string
      os: string
      ["os.version"]?: string
      ["os.features"]?: string[]
    } | null
    artifactType: string | null
  }
  Platforms: Array<{
    architecture: string
    os: string
    ["os.version"]?: string
    ["os.features"]?: string[]
    variant?: string
  }>
}
