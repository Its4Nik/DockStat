type FontSpec = {
    font_size: string // e.g. "0.875rem"
    family: string;
    font_weight?: number
    color: string
}

type CardComponent = {
  bg?: string
  accent?: string
  border: boolean
  border_color?: string
  border_size?: number
  title: FontSpec
  sub_title: FontSpec
  content: FontSpec
  footer_padding?: string
  header_padding?: string
  padding?: string
  radius?: string
  shadow?: string
}

type BadgeComponent = {
  default_bg: string
  default_color: string
  error_bg: string
  error_color: string
  success_bg: string
  success_color: string
  warning_bg: string
  warning_color: string
  padding_x?: string
  padding_y?: string
  font_size?: string
  radius?: string
}

type ButtonComponent = {
  primary_bg: string
  primary_color: string
  primary_hover_bg?: string
  secondary_bg: string
  secondary_color: string
  secondary_hover_bg?: string
  padding_x?: string
  padding_y?: string
  font_size?: string
  radius?: string
}

type ChartComponent = {
  axis_color: string
  bar_color: string
  bg: string
  grid_color: string
  label_color: string
  title_color: string
  title_font_size?: string
  tooltip_bg?: string
  tooltip_color?: string
  tooltip_border?: string
  padding?: string
  radius?: string
  chart_radius?: string
  chart_tooltip_radius?: string
}

type DialogComponent = {
  bg: string
  overlay_bg?: string
  padding?: string
  radius?: string
  shadow?: string
}

type DropdownComponent = {
  bg: string
  item_hover_bg?: string
  item_hover_color?: string
  radius?: string
  shadow?: string
}

type HovercardComponent = {
  bg: string
  padding?: string
  radius?: string
  shadow?: string
}

type InputComponent = {
  bg: string
  color: string
  padding_x?: string
  padding_y?: string
  font_size?: string
  radius?: string
  border?: string
  focus_ring?: string
}

type ProgressComponent = {
  bar_bg: string
  bg: string
  radius?: string
}

type SonnerComponent = {
  bg: string
  button_bg?: string
  button_color?: string
  cancel_bg?: string
  cancel_color?: string
  close_bg?: string
  close_color?: string
  color?: string

  // variants
  error_bg?: string
  error_border?: string
  error_color?: string

  info_bg?: string
  info_border?: string
  info_color?: string

  loading_bg?: string
  loading_color?: string
  loading_border?: string

  success_bg?: string
  success_border?: string
  success_color?: string

  title_font_size?: string
  button_font_size?: string
  description_font_size?: string
  border?: string
}

type SwitchComponent = {
  bg?: string
  enabled_bg?: string
  thumb_bg?: string
  thumb_enabled_transform?: string
  thumb_size?: string
  width?: string
  height?: string
  radius?: string
  thumb_radius?: string
  focus_ring?: string
}

type TableComponent = {
  body_bg?: string
  header_bg?: string
  cell_padding_x?: string
  cell_padding_y?: string
  cell_font_size?: string
  divider?: string
  radius?: string
}

type TextareaComponent = {
  bg: string
  color: string
  padding_x?: string
  padding_y?: string
  font_size?: string
  radius?: string
  border?: string
  focus_ring?: string
}

export type THEME_components = {
  card: CardComponent
  badge: BadgeComponent
  button: ButtonComponent
  chart: ChartComponent
  dialog: DialogComponent
  dropdown: DropdownComponent
  hovercard: HovercardComponent
  input: InputComponent
  progress: ProgressComponent
  sonner: SonnerComponent
  switch: SwitchComponent
  table: TableComponent
  textarea: TextareaComponent
}
