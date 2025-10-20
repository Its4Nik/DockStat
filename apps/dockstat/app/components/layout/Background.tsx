import type { THEME } from "@dockstat/typings";

export default function Background(theme: THEME.ThemeTable) {
  if (theme.config.bg.useEffect) {
    switch (theme.config.bg.effect) {
      case "linear-gradient": {
        return <LinearBG direction={theme.config.bg.linearGradientDirection} />
      }
    }
  }
  return;
}

type LinearBGProps = {
  colors: string[]
  direction: THEME.ThemeConfig["bg"]["linearGradientDirection"]
}

function LinearBG({ direction, colors }: LinearBGProps) {
  return (
    <body>

    </body>
  )
}
