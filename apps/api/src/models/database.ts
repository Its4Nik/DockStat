import {
  CreateRepo,
  DockStatConfigTable,
  Repo,
  RepoResponse,
  UpdateDockStatConfigTableResponse,
  UpdateRepo,
} from "@dockstat/typings/schemas"
import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { t } from "elysia"

export namespace DatabaseModel {
  export const updateBody = DockStatConfigTable
  export type updateBody = DockStatConfigTableType

  export const updateRes = UpdateDockStatConfigTableResponse
  export type updateRes = typeof UpdateDockStatConfigTableResponse.static

  export const configRes = DockStatConfigTable

  export const error = t.Object({
    success: t.Literal(false),
    error: t.String(),
    message: t.String(),
  })

  export const updateError = t.Object({
    success: t.Literal(false),
    message: t.String(),
    error: t.String(),
  })

  export const configResponses = t.Object({
    200: configRes,
    400: error,
  })
}

export namespace RepositoryModel {
  // Request body schemas
  export const createBody = CreateRepo
  export const updateBody = UpdateRepo

  // Response schemas
  export const repo = Repo
  export const repoList = t.Array(Repo)
  export const response = RepoResponse

  export const error = t.Object({
    success: t.Literal(false),
    message: t.String(),
    error: t.String(),
  })

  export const successResponseMultipleRepos = t.Object({
    success: t.Literal(true),
    message: t.String(),
    data: t.Array(Repo),
  })

  export const successResponse = t.Object({
    success: t.Literal(true),
    message: t.String(),
    data: Repo,
  })

  export const deleteResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  })
}
