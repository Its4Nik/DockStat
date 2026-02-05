export type themeType = {
  id: number
  name: string
  variables: Record<string, string>
  animations: Record<string, Record<string, string | number>>
}
