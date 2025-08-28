import type { THEME_components } from './theme-components'

type THEME_config = {
  name: string
  version: string
  creator: string
  license: string
  description: string
  active: boolean | 0 | 1
  vars: THEME_vars
}

type THEME_background_effect_aurora = {
  Aurora: {
    colorList: string[]
  }
}
type THEME_background_effect_gradient = {
  Gradient: {
    from: string
    to: string
    direction:
      | 'l-t'
      | 'r-l'
      | 'b-t'
      | 't-b'
      | 'tl-br'
      | 'tr-bl'
      | 'bl-tr'
      | 'br-tl'
      | 'radial'
  }
}

type THEME_background_effect_solid = {
  Solid: {
    color: string
  }
}

type THEME_vars = {
  background_effect: THEME_background_effects
  components: THEME_components
}

type THEME_background_effects =
  | THEME_background_effect_aurora
  | THEME_background_effect_gradient
  | THEME_background_effect_solid

export type {
  THEME_background_effects,
  THEME_background_effect_aurora,
  THEME_background_effect_gradient,
  THEME_background_effect_solid,
  THEME_components,
  THEME_config,
  THEME_vars,
}
