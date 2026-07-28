import type {
  AddExternalCertificateBody,
  Certificate,
  CertificateAlgorithm,
  CertificateDeleteResponse,
  CertificateFormat,
  CertificateListResponse,
  CertificateResolveResponse,
  CertificateResponse,
  CertificateRevealResponse,
  CertificateSource,
  CertificateType,
  GenerateCertificateBody,
  ImportCertificateBody,
  ResolveCertificateBody,
  UpdateCertificateBody,
} from "./certificates"
import type {
  CreateRepo,
  DockStatConfigTable,
  PluginHashes,
  Repo,
  RepoResponse,
  TableMetaData,
  UpdateDockStatConfigTableResponse,
  UpdateRepo,
} from "./db"
import type { RepoManifest } from "./dockstore"
import type { DBPlugin, DBPluginShemaT, Plugin, WrappedPluginMeta } from "./plugins"

export type {
  buildMessageFromProxyRes,
  ProxyEventMessage,
} from "../docker-client-worker"
export type { DockerStreamManagerProxy } from "../docker-monitoring-manager"

type DockStatConfigTableType = typeof DockStatConfigTable.static
type RepoType = typeof Repo.static
type CreateRepoType = typeof CreateRepo.static
type UpdateRepoType = typeof UpdateRepo.static
type RepoResponseType = typeof RepoResponse.static
type PluginHashesType = typeof PluginHashes.static
type TableMetaDataType = typeof TableMetaData.static
type UpdateDockStatConfigTableResponseType = typeof UpdateDockStatConfigTableResponse.static
type PluginMetaType = typeof WrappedPluginMeta.static
type RepoManifestType = typeof RepoManifest.static

type CertificateTypeType = typeof CertificateType.static
type CertificateSourceType = typeof CertificateSource.static
type CertificateAlgorithmType = typeof CertificateAlgorithm.static
type CertificateFormatType = typeof CertificateFormat.static
type CertificateTypeRow = typeof Certificate.static
type CertificateResponseType = typeof CertificateResponse.static
type CertificateListResponseType = typeof CertificateListResponse.static
type CertificateDeleteResponseType = typeof CertificateDeleteResponse.static
type CertificateRevealResponseType = typeof CertificateRevealResponse.static
type CertificateResolveResponseType = typeof CertificateResolveResponse.static
type GenerateCertificateBodyType = typeof GenerateCertificateBody.static
type ImportCertificateBodyType = typeof ImportCertificateBody.static
type AddExternalCertificateBodyType = typeof AddExternalCertificateBody.static
type UpdateCertificateBodyType = typeof UpdateCertificateBody.static
type ResolveCertificateBodyType = typeof ResolveCertificateBody.static

export type {
  AddExternalCertificateBodyType,
  CertificateAlgorithmType,
  CertificateDeleteResponseType,
  CertificateFormatType,
  CertificateListResponseType,
  CertificateResolveResponseType,
  CertificateResponseType,
  CertificateRevealResponseType,
  CertificateSourceType,
  CertificateTypeType,
  CertificateTypeRow,
  CreateRepoType,
  DockStatConfigTableType,
  DBPlugin,
  DBPluginShemaT,
  GenerateCertificateBodyType,
  ImportCertificateBodyType,
  Plugin,
  PluginHashesType,
  PluginMetaType,
  RepoManifestType,
  RepoResponseType,
  RepoType,
  ResolveCertificateBodyType,
  TableMetaDataType,
  UpdateDockStatConfigTableResponseType,
  UpdateCertificateBodyType,
  UpdateRepoType,
}
