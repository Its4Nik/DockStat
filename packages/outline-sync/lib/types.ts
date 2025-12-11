export type PageEntry = {
  title: string
  file: string
  id: string | null
  children?: PageEntry[]
}

export type Manifest = {
  collectionId: string
  pages: PageEntry[]
}

export type TopCollectionConfig = {
  id: string
  configDir?: string
  name?: string
  saveDir?: string
  pagesFile?: string
  configFile?: string
}

export type TopConfig = {
  collections: TopCollectionConfig[]
}

export type MappingRule = {
  match: { id?: string; title?: string }
  path: string // relative path where to save
}

export type CollectionConfig = {
  collectionId: string
  saveDir?: string
  mappings?: MappingRule[]
}

// Outline Specific typings:

export interface CollectionResponse {
  data: Collection[]
  pagination: Pagination
  policies: Policy[]
}

export interface Collection {
  id: string // uuid
  urlId: string
  name: string
  description: string
  sort?: CollectionSort
  index: string
  color: string // HEX (#xxxxxx)
  icon?: string
  permission: "read" | "read_write"
  sharing: boolean
  createdAt: string // date-time
  updatedAt: string // date-time
  deletedAt?: string | null // date-time
  archivedAt?: string | null // date-time
  archivedBy?: ArchivedByUser
}

export interface CollectionSort {
  field: string
  direction: "asc" | "desc"
}

export interface ArchivedByUser {
  id: string // uuid
  name: string
  avatarUrl: string // uri
  email: string // email
  role: "admin" | "member" | "viewer" | "guest"
  isSuspended: boolean
  lastActiveAt: string // date-time
  createdAt: string // date-time
}

export interface Pagination {
  offset: number
  limit: number
}

export interface Policy {
  id: string // uuid
  abilities: Record<string, boolean | string[]>
}

export interface Node extends Document {
  file: string
  children: Node[]
}

export interface DocumentResponse {
  data: Document[]
  policies: DocumentPolicy[]
  pagination: Pagination
}

export interface SingleDocumentResponse {
  data: Document
  policies: DocumentPolicy[]
  pagination: Pagination
}

export interface Document {
  id: string // uuid
  collectionId: string // uuid
  parentDocumentId?: string // uuid
  title: string
  fullWidth: boolean
  emoji?: string
  text: string // markdown
  urlId: string
  collaborators: User[]
  pinned: boolean
  template: boolean
  templateId?: string // uuid
  revision: number
  createdAt: string // date-time
  createdBy: User
  updatedAt: string // date-time
  updatedBy: User
  publishedAt?: string | null // date-time
  archivedAt?: string // date-time
  deletedAt?: string | null // date-time
}

export interface User {
  id: string // uuid
  name: string
  avatarUrl: string // uri
  email: string // email
  role: "admin" | "member" | "viewer" | "guest"
  isSuspended: boolean
  lastActiveAt: string // date-time
  createdAt: string // date-time
}

export interface DocumentPolicy {
  id: string // uuid
  abilities: Record<string, boolean | string[]>
}

export interface DocumentWithPoliciesResponse {
  data: Document
  policies: Policy[]
}
