import type { RepoFile } from "../types"

export async function loadRepo(path: string): Promise<RepoFile | null> {
  const file = Bun.file(path)
  if (!(await file.exists())) return null
  return file.json()
}

export async function saveRepo(path: string, data: RepoFile): Promise<void> {
  await Bun.write(path, JSON.stringify(data, null, 2))
}
