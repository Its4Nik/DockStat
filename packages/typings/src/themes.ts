export type ThemeTable = {
  name: string,
  creator: string,
  license: string,
  vars: Record<string, string>
  config: ThemeConfig
}

export type ThemeConfig = {
  bg: {
    useEffect: boolean
    effect: "gradient" | "radial" | "aurora"
    colors: string[] // Color Variables [0,1,2,3,4,...]
  }
}
