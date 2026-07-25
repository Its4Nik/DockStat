import type { DockNode } from "."

type DockNodeTreaty = typeof DockNode

export type { DockNodeTreaty }

export type {
  CommandResult,
  DockerComposePsResult,
  IDockerComposeResult,
  TypedDockerComposeResult,
} from "./stacks/types"
