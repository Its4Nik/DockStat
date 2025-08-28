import type { THEME } from '@dockstat/typings'

export const darkDockStatTheme: THEME.THEME_config = {
  name: 'default-dark',
  creator: 'Its4Nik',
  version: '1.0.0',
  active: true,
  description: 'Default DockStat Dark Theme — tuned for Tailwind CSS variables',
  license: 'MIT',
  vars: {
    background_effect: {
      Solid: {
        color: '#0b1220', // page background
      },
    },

    components: {
      // --- BADGE
      badge: {
        default_bg: '#1f2937',
        default_color: '#cbd5e1',
        error_bg: '#4c1f1f',
        error_color: '#fecaca',
        success_bg: '#052e16',
        success_color: '#bbf7d0',
        warning_bg: '#3f2a0b',
        warning_color: '#ffdba1',
        padding_x: '0.5rem',
        padding_y: '0.125rem',
        font_size: '0.75rem',
        radius: '9999px',
      },

      // --- BUTTON
      button: {
        primary_bg: '#2563eb',
        primary_color: '#ffffff',
        primary_hover_bg: '#1e40af',
        secondary_bg: '#0f1724',
        secondary_color: '#cbd5e1',
        secondary_hover_bg: '#111827',
        padding_x: '0.75rem',
        padding_y: '0.5rem',
        font_size: '0.875rem',
        radius: '0.5rem',
      },

      // --- CARD
      card: {
        bg: '#0f1724',
        border: true,
        content: {
            family: 'Inter, sans-serif',
            color: '#e6eef8',
            font_size: '0.875rem',
            font_weight: 400,
        },
        title: {
          family: 'Inter, sans-serif',
          color: '#f8fafc',
          font_size: '1rem',
          font_weight: 600,
        },
        sub_title: {
          family: 'Inter, sans-serif',
          color: '#cbd5e1',
          font_size: '0.875rem',
          font_weight: 500,
        },
        footer_padding: '0.75rem',
        header_padding: '0.75rem',
        padding: '1rem',
        radius: '0.5rem',
        shadow: '0 6px 18px rgba(2,6,23,0.6)',
      },

      // --- CHART
      chart: {
        axis_color: '#94a3b8',
        bar_color: '#60a5fa',
        bg: '#071023',
        grid_color: '#0f1724',
        label_color: '#cbd5e1',
        title_color: '#e2e8f0',
        title_font_size: '1rem',
        tooltip_bg: '#0b1220',
        tooltip_color: '#e5e7eb',
        tooltip_border: '#374151',
        padding: '1rem',
        radius: '0.375rem',
        chart_radius: '0.375rem',
        chart_tooltip_radius: '0.375rem',
      },

      // --- DIALOG / MODAL
      dialog: {
        bg: '#0b1220',
        overlay_bg: 'rgba(2,6,23,0.6)',
        padding: '1rem',
        radius: '0.5rem',
        shadow: '0 12px 30px rgba(2,6,23,0.7)',
      },

      // --- DROPDOWN
      dropdown: {
        bg: '#0b1220',
        item_hover_bg: '#111827',
        item_hover_color: '#e2e8f0',
        radius: '0.375rem',
        shadow: '0 10px 24px rgba(2,6,23,0.6)',
      },

      // --- HOVERCARD
      hovercard: {
        bg: '#0b1220',
        padding: '0.75rem',
        radius: '0.375rem',
        shadow: '0 8px 20px rgba(2,6,23,0.6)',
      },

      // --- INPUT
      input: {
        bg: '#0f1724',
        color: '#e6eef8',
        padding_x: '0.5rem',
        padding_y: '0.5rem',
        font_size: '0.875rem',
        radius: '0.375rem',
        border: '#334155',
        focus_ring: 'rgba(37,99,235,0.35)',
      },

      // --- PROGRESS
      progress: {
        bar_bg: '#2563eb',
        bg: '#0b1220',
        radius: '9999px',
      },

      // --- SONNER (notifications)
      sonner: {
        bg: '#0f1724',
        button_bg: '#2563eb',
        button_color: '#ffffff',
        cancel_bg: '#374151',
        cancel_color: '#e2e8f0',
        close_bg: '#0b1220',
        close_color: '#cbd5e1',
        color: '#e2e8f0',

        // error
        error_bg: '#3f1f1f',
        error_border: '#7f1d1d',
        error_color: '#fecaca',

        // info
        info_bg: '#071033',
        info_border: '#1f2937',
        info_color: '#c7d2fe',

        // loading
        loading_bg: '#0b1220',
        loading_color: '#94a3b8',
        loading_border: '#94a3b8',

        // success
        success_bg: '#052e16',
        success_border: '#064e3b',
        success_color: '#bbf7d0',

        title_font_size: '1rem',
        button_font_size: '0.875rem',
        description_font_size: '0.875rem',
        border: '#334155',
      },

      // --- SWITCH
      switch: {
        bg: '#0b1220',
        enabled_bg: '#2563eb',
        thumb_bg: '#cbd5e1',
        thumb_enabled_transform: 'translateX(0.6875rem)', // example transform
        thumb_size: '1rem',
        width: '2.25rem',
        height: '1.25rem',
        radius: '9999px',
        thumb_radius: '0.5rem',
        focus_ring: 'rgba(96,165,250,0.35)',
      },

      // --- TABLE
      table: {
        body_bg: '#071023',
        header_bg: '#0b1220',
        cell_padding_x: '0.75rem',
        cell_padding_y: '0.5rem',
        cell_font_size: '0.875rem',
        divider: '#1f2937',
        radius: '0.375rem',
      },

      // --- TEXTAREA
      textarea: {
        bg: '#0f1724',
        color: '#e6eef8',
        padding_x: '0.5rem',
        padding_y: '0.5rem',
        font_size: '0.875rem',
        radius: '0.375rem',
        border: '#334155',
        focus_ring: 'rgba(37,99,235,0.35)',
      },
    },
  },
}
