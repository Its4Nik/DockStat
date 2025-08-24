// app/utils/theme-css.ts
import type { THEME } from '@dockstat/typings'

function gradientDirectionToDegrees(
  dir: THEME.THEME_background_effect_gradient['Gradient']['direction']
) {
  // simple mapping (tailor if you prefer different angles)
  switch (dir) {
    case 'l-t':
      return 'to top left'
    case 'r-l':
      return 'to left'
    case 'b-t':
      return 'to top'
    case 't-b':
      return 'to bottom'
    case 'tl-br':
      return 'to bottom right'
    case 'tr-bl':
      return 'to bottom left'
    case 'bl-tr':
      return 'to top right'
    case 'br-tl':
      return 'to top left'
    case 'radial':
      return 'radial-gradient'
    default:
      return 'to bottom'
  }
}

export function themeToCSS(theme: THEME.THEME_config): string {
  const vars = theme.vars
  const lines: string[] = []

  // Root CSS variables for component styling
  // Example mapping for Card component (expand for other components)
  if (vars.components?.Card) {
    const c = vars.components.Card
    lines.push(':root {')
    lines.push(`  --card-accent: ${c.accent};`)
    lines.push(`  --card-border-enabled: ${c.border ? '1' : '0'};`)
    lines.push(`  --card-border-color: ${c.border_color};`)
    lines.push(`  --card-border-size: ${c.border_size}px;`)
    lines.push(`  --card-title-font: ${c.title.font};`)
    lines.push(`  --card-title-color: ${c.title.color};`)
    lines.push(`  --card-title-size: ${c.title.font_size}px;`)
    lines.push(`  --card-title-weight: ${c.title.font_weight};`)
    lines.push(`  --card-subtitle-font: ${c.sub_title.font};`)
    lines.push(`  --card-subtitle-color: ${c.sub_title.color};`)
    lines.push(`  --card-subtitle-size: ${c.sub_title.font_size}px;`)
    lines.push(`  --card-subtitle-weight: ${c.sub_title.font_weight};`)
    lines.push(`  --card-content-font: ${c.content.font};`)
    lines.push(`  --card-content-color: ${c.content.color};`)
    lines.push(`  --card-content-size: ${c.content.font_size}px;`)
    lines.push(`  --card-content-weight: ${c.content.font_weight};`)
    lines.push('}')
  }

  // Body / background effects
  // We'll create a wrapper class `.dockstat-bg` applied to <body> for the background effect.
  // The ThemeContextOutlet will inject CSS that sets body to use .dockstat-bg styles.
  const bg = vars.background_effect
  if ('Aurora' in bg) {
    const aurora = (bg as THEME.THEME_background_effect_aurora).Aurora
    // Multi-layer radial gradients with animation
    const colors = aurora.colorList.length
      ? aurora.colorList.slice(0, 5)
      : ['rgba(255,0,150,0.15)', 'rgba(0,120,255,0.12)']
    lines.push(`
.dockstat-bg {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #0b0f14;
}
.dockstat-bg::before,
.dockstat-bg::after {
  content: "";
  position: absolute;
  inset: -20%;
  z-index: -1;
  filter: blur(80px);
  opacity: 0.9;
  animation: dockstat-aurora 18s linear infinite;
  mix-blend-mode: screen;
}
.dockstat-bg::before {
  background: radial-gradient(circle at 10% 20%, ${colors[0] || 'rgba(255,0,150,0.12)'}, transparent 20%),
              radial-gradient(circle at 80% 60%, ${colors[1] || 'rgba(0,120,255,0.10)'}, transparent 30%);
  animation-duration: 20s;
}
.dockstat-bg::after {
  background: radial-gradient(circle at 30% 70%, ${colors[2] || 'rgba(0,220,150,0.10)'}, transparent 25%),
              radial-gradient(circle at 70% 30%, ${colors[3] || 'rgba(255,200,0,0.06)'}, transparent 30%);
  animation-duration: 25s;
}
@keyframes dockstat-aurora {
  0% { transform: translateY(0) rotate(0deg) scale(1); }
  50% { transform: translateY(-8%) rotate(12deg) scale(1.05); }
  100% { transform: translateY(0) rotate(0deg) scale(1); }
}
`)
  } else if ('Gradient' in bg) {
    const g = (bg as THEME.THEME_background_effect_gradient).Gradient
    if (g.direction === 'radial') {
      lines.push(`
.dockstat-bg {
  min-height: 100vh;
  background: radial-gradient(circle at center, ${g.from}, ${g.to});
}
`)
    } else {
      const dir = gradientDirectionToDegrees(g.direction)
      lines.push(`
.dockstat-bg {
  min-height: 100vh;
  background: linear-gradient(${dir}, ${g.from}, ${g.to});
}
`)
    }
  } else if ('Solid' in bg) {
    const s = (bg as THEME.THEME_background_effect_solid).Solid
    lines.push(`
.dockstat-bg {
  min-height: 100vh;
  background: ${s.color};
}
`)
  } else {
    // fallback
    lines.push(`
.dockstat-bg {
  min-height: 100vh;
  background: transparent;
}
`)
  }

  // small helper classes for cards using the CSS variables above (Tailwind can still use var(...) in your classes)
  lines.push(`
/* Card helper (you can also read these vars from Tailwind with var(--card-accent)) */
.card {
  border-style: solid;
  border-width: calc(var(--card-border-size, 1) * 1px);
  border-color: var(--card-border-color, transparent);
  background: white;
  box-shadow: 0 8px 20px rgba(2,6,23,0.06);
  padding: 1rem;
  border-radius: 0.5rem;
}
.card--no-border {
  border: none;
}
.card__title {
  font-family: var(--card-title-font, system-ui);
  color: var(--card-title-color, inherit);
  font-size: var(--card-title-size, 18px);
  font-weight: var(--card-title-weight, 600);
}
.card__subtitle {
  font-family: var(--card-subtitle-font, system-ui);
  color: var(--card-subtitle-color, inherit);
  font-size: var(--card-subtitle-size, 14px);
  font-weight: var(--card-subtitle-weight, 500);
}
.card__content {
  font-family: var(--card-content-font, system-ui);
  color: var(--card-content-color, inherit);
  font-size: var(--card-content-size, 14px);
  font-weight: var(--card-content-weight, 400);
}
`)

  const header = `/* Theme: ${theme.name} v${theme.version} by ${theme.creator} (${theme.license}) */\n`
  return header + lines.join('\n')
}
