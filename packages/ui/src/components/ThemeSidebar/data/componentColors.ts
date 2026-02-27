import componentColorsJson from "./componentColors.json"

export type ComponentColor = {
  colorName: string
  displayName: string
}

export type ComponentColors = {
  name: string
  colors: ComponentColor[]
}

export type ComponentColorsData = {
  components: Record<string, ComponentColors>
}

export const componentColorsData: ComponentColorsData = componentColorsJson

export const getAllComponents = () => {
  return Object.values(componentColorsData.components).map((component) => component.name)
}

export const getComponentColors = (componentName: string) => {
  const component = componentColorsData.components[componentName]
  return component ? component.colors : []
}

export const getAllComponentColors = () => {
  return Object.values(componentColorsData.components).flatMap((component) =>
    component.colors.map((color) => ({
      ...color,
      componentName: component.name,
    }))
  )
}
