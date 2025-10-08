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
    effect: "linear-gradient" | "radial-gradient" | "aurora"
    colors: string[] // Color Variables [0,1,2,3,4,...]
    linearGradientDirection?: "t-b"
    | "l-r"
    | "r-l"
    | "b-t"
    | "tl-br"
    | "tr-bl"
    | "bl-tr"
    | "br-tl"
  }
}
