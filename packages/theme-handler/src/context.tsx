import type { THEME } from '@dockstat/typings'
import { useState } from 'react'
import { Outlet } from 'react-router'

export function ThemeContextOutlet() {
  const [theme, setTheme] = useState<THEME.THEME_config>()
  return <Outlet context={[theme, setTheme]} />
}
