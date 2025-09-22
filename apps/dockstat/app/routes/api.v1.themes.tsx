import ServerInstance from "~/.server";

export function loader() {
  const allThemes = ServerInstance.getThemeHandler().getAll()

  return allThemes
}
