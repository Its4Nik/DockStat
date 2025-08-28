import type { THEME } from '@dockstat/typings'

export const darkDockStatTheme: THEME.THEME_config = {
  name: 'default',
  creator: 'Its4Nik',
  version: '1.0.0',
  active: true,
  description: 'Default DockStat Theme in a Dark Color Way',
  license: 'MIT',
  vars: {
    background_effect: {
      Solid: {
        color: '#1e1e2e',
      },
    },
    components: {
      Card: {
        accent: '#94a3b8',
        border: true,
        border_color: '#334155',
        border_size: 1,
        title: {
          font: 'Inter, sans-serif',
          color: '#f8fafc',
          font_size: 16,
          font_weight: 600,
        },
        sub_title: {
          font: 'Inter, sans-serif',
          color: '#cbd5e1',
          font_size: 14,
          font_weight: 500,
        },
        content: {
          font: 'Inter, sans-serif',
          color: '#e2e8f0',
          font_size: 14,
          font_weight: 400,
        },
      },
    },
  },
}
