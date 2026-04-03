import type { BodyInit } from "bun";
import { BaseModule } from "../base";
import type {
  ContainerSummary,
  ContainerInspectResponse,
  ContainerTopResponse,
  ContainerStatsResponse,
  ContainerWaitResponse,
  ContainerCreateResponse,
  ContainerUpdateResponse,
  ContainerPruneResponse,
  FilesystemChange,
  ExecCreateOptions,
  ExecCreateResponse,
  ExecStartOptions,
  ExecInspectResponse,
  ArchiveInfo,
  ListContainersOptions,
  CreateContainerOptions,
  UpdateContainerOptions,
  AttachOptions,
  LogsOptions,
  WaitCondition,
  PruneContainersOptions,
  StatsOptions,
} from "./types";

/**
 * WebSocket-like interface for Docker container attach
 * Uses the attach endpoint with stream wrapping for compatibility with Unix sockets
 *
 * @note Currently supports read-only operations (receiving stdout/stderr). Full WebSocket
 * protocol support with bidirectional communication is planned for future versions.
 */
class DockerWebSocket {
  private static readonly CONNECTING = 0;
  private static readonly OPEN = 1;
  private static readonly CLOSING = 2;
  private static readonly CLOSED = 3;

  private readyStateValue: number = DockerWebSocket.CONNECTING;
  private listeners: Map<string, Array<(event: any) => void>> = new Map();
  private reader: any = null;

  addEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      const index = typeListeners.indexOf(listener);
      if (index > -1) {
        typeListeners.splice(index, 1);
      }
    }
  }

  async attach(response: Response) {
    if (!response.body) {
      this.emit('error', new Error('Response has no body'));
      this.readyStateValue = DockerWebSocket.CLOSED;
      this.emit('close', {});
      return;
    }

    this.reader = response.body.getReader();
    this.readyStateValue = DockerWebSocket.OPEN;
    this.emit('open', {});

    try {
      while (this.readyStateValue === DockerWebSocket.OPEN) {
        const { done, value } = await this.reader.read();
        if (done) break;

        // Decode the chunk to string
        const text = new TextDecoder().decode(value);
        this.emit('message', { data: text });
      }
    } catch (error) {
      if (this.readyStateValue !== DockerWebSocket.CLOSING) {
        this.emit('error', error);
      }
    } finally {
      this.readyStateValue = DockerWebSocket.CLOSED;
      this.emit('close', {});
    }
  }

  close() {
    if (this.readyStateValue === DockerWebSocket.CLOSED) return;

    this.readyStateValue = DockerWebSocket.CLOSING;

    if (this.reader) {
      this.reader.cancel().catch(() => {});
    }

    this.readyStateValue = DockerWebSocket.CLOSED;
    this.emit('close', {});
  }

  get CONNECTING() { return DockerWebSocket.CONNECTING; }
  get OPEN() { return DockerWebSocket.OPEN; }
  get CLOSING() { return DockerWebSocket.CLOSING; }
  get CLOSED() { return DockerWebSocket.CLOSED; }

  get readyState() { return this.readyStateValue; }

  private emit(type: string, event: any) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }
}

/**
 * Container Module - handles all Docker container operations
 */
export class ContainerModule extends BaseModule {
  /**
   * List containers
   * @param options - List options
   * @returns Array of container summaries
   */
  async list(options?: ListContainersOptions): Promise<ContainerSummary[]> {
    const params = new URLSearchParams();

    if (options?.all) params.append("all", "true");
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.size) params.append("size", "true");
    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters));
    }

    const query = params.toString();
    const path = `/containers/json${query ? `?${query}` : ""}`;
    const res = await this.request(path, "GET");
    return await res.json() as ContainerSummary[];
  }

  /**
   * Create a container
   * @param config - Container configuration
   * @param options - Create options
   * @returns Container create response with ID
   */
  async create(
    config: any,
    options?: CreateContainerOptions
  ): Promise<ContainerCreateResponse> {
    const params = new URLSearchParams();

    if (options?.name) params.append("name", options.name);
    if (options?.platform) params.append("platform", options.platform);

    const query = params.toString();
    const path = `/containers/create${query ? `?${query}` : ""}`;
    const res = await this.request(path, "POST", config);
    return await res.json() as ContainerCreateResponse;
  }

  /**
   * Inspect a container
   * @param id - Container ID or name
   * @param size - Return container size information
   * @returns Detailed container information
   */
  async inspect(id: string, size: boolean = false): Promise<ContainerInspectResponse> {
    const query = size ? "?size=true" : "";
    const res = await this.request(`/containers/${id}/json${query}`, "GET");
    return await res.json() as ContainerInspectResponse;
  }

  /**
   * Start a container
   * @param id - Container ID or name
   * @param detachKeys - Override the key sequence for detaching
   */
  async start(id: string, detachKeys?: string): Promise<void> {
    const params = new URLSearchParams();
    if (detachKeys) params.append("detachKeys", detachKeys);

    const query = params.toString();
    await this.request(`/containers/${id}/start${query ? `?${query}` : ""}`, "POST");
  }

  /**
   * Stop a container
   * @param id - Container ID or name
   * @param t - Number of seconds to wait before killing the container
   */
  async stop(id: string, t?: number): Promise<void> {
    const params = new URLSearchParams();
    if (t) params.append("t", t.toString());

    const query = params.toString();
    await this.request(`/containers/${id}/stop${query ? `?${query}` : ""}`, "POST");
  }

  /**
   * Restart a container
   * @param id - Container ID or name
   * @param t - Number of seconds to wait before killing the container
   */
  async restart(id: string, t?: number): Promise<void> {
    const params = new URLSearchParams();
    if (t) params.append("t", t.toString());

    const query = params.toString();
    await this.request(`/containers/${id}/restart${query ? `?${query}` : ""}`, "POST");
  }

  /**
   * Kill a container
   * @param id - Container ID or name
   * @param signal - Signal to send to the container
   */
  async kill(id: string, signal?: string): Promise<void> {
    const params = new URLSearchParams();
    if (signal) params.append("signal", signal);

    const query = params.toString();
    await this.request(`/containers/${id}/kill${query ? `?${query}` : ""}`, "POST");
  }

  /**
   * Remove a container
   * @param id - Container ID or name
   * @param v - Remove anonymous volumes associated with the container
   * @param force - Force removal of running containers
   * @param link - Remove the specified link associated with the container
   */
  async remove(
    id: string,
    v: boolean = false,
    force: boolean = false,
    link: boolean = false
  ): Promise<void> {
    const params = new URLSearchParams();
    if (v) params.append("v", "true");
    if (force) params.append("force", "true");
    if (link) params.append("link", "true");

    const query = params.toString();
    await this.request(`/containers/${id}${query ? `?${query}` : ""}`, "DELETE");
  }

  /**
   * Rename a container
   * @param id - Container ID or name
   * @param name - New name for the container
   */
  async rename(id: string, name: string): Promise<void> {
    const query = new URLSearchParams({ name }).toString();
    await this.request(`/containers/${id}/rename?${query}`, "POST");
  }

  /**
   * Pause a container
   * @param id - Container ID or
 name
   */
  async pause(id: string): Promise<void> {
    await this.request(`/containers/${id}/pause`, "POST");
  }

  /**
   * Unpause a container
   * @param id - Container ID or name
   */
  async unpause(id: string): Promise<void> {
    await this.request(`/containers/${id}/unpause`, "POST");
  }

  /**
   * Wait for a container
   * @param id - Container ID or name
   * @param condition - Wait until condition is met
   * @returns Container wait response with exit status
   */
  async wait(
    id: string,
    condition?: WaitCondition
  ): Promise<ContainerWaitResponse> {
    const params = new URLSearchParams();
    if (condition) params.append("condition", condition);

    const query = params.toString();
    const res = await this.request(
      `/containers/${id}/wait${query ? `?${query}` : ""}`,
      "POST"
    );
    return await res.json() as ContainerWaitResponse;
  }

  /**
   * List processes running inside a container
   * @param id - Container ID or name
   * @param
   * ps_args - Arguments for ps command
   * @returns Top processes response
   */
  async top(id: string, ps_args?: string): Promise<ContainerTopResponse> {
    const query = ps_args ? `?ps_args=${encodeURIComponent(ps_args)}` : "";
    const res = await this.request(`/containers/${id}/top${query}`, "GET");
    return await res.json() as ContainerTopResponse;
  }

  /**
   * Get container logs
   * @param id - Container ID or name
   * @param options - Log options
   * @returns Log stream
   */
  async logs(id: string, options?: LogsOptions): Promise<Response> {
    const params = new URLSearchParams();

    if (options?.follow) params.append("follow", "true");
    if (options?.stdout) params.append("stdout", "true");
    if (options?.stderr) params.append("stderr", "true");
    if (options?.since) params.append("since", options.since.toString());
    if (options?.until) params.append("until", options.until.toString());
    if (options?.timestamps) params.append("timestamps", "true");
    if (options?.tail) params.append("tail", options.tail);

    const query = params.toString();
    return await this.request(`/containers/${id}/logs${query ? `?${query}` : ""}`, "GET");
  }

  /**
   * Get container resource usage statistics
   * @param id - Container ID or name
   * @param options - Stats options
   * @returns Container stats response
   */
  async stats(
    id: string,
    options?: StatsOptions
  ): Promise<ContainerStatsResponse | Response> {
    const params = new URLSearchParams();

    if (options?.stream !== undefined) params.append("stream", options.stream.toString());
    if (options?.["one-shot"]) params.append("one-shot", "true");

    const query = params.toString();
    const res = await this.request(
      `/containers/${id}/stats${query ? `?${query}` : ""}`,
      "GET"
    );

    // If streaming, return the response directly
    if (options?.stream) {
      return res;
    }

    return await res.json() as ContainerStatsResponse;
  }

  /**
   * Get changes on container filesystem
   * @param id - Container ID or name
   * @returns Array of filesystem changes
   */
  async changes(id: string): Promise<FilesystemChange[]> {
    const res = await this.request(`/containers/${id}/changes`, "GET");
    return await res.json() as FilesystemChange[];
  }

  /**
   * Export a container
   * @param id - Container ID or name
   * @returns Exported container archive
   */
  async export(id: string): Promise<Response> {
    return await this.request(`/containers/${id}/export`, "GET");
  }

  /**
   * Update container configuration
   * @param id - Container ID or name
   * @param options - Update options
   * @returns Update response with warnings
   */
  async update(
    id: string,
    options: UpdateContainerOptions
  ): Promise<ContainerUpdateResponse> {
    const res = await this.request(`/containers/${id}/update`, "POST", options);
    return res.json() as ContainerUpdateResponse;
  }

  /**
   * Resize container TTY
   * @param id - Container ID or name
   * @param h - Height of the TTY session
   * @param w - Width of the TTY session
   */
  async resize(id: string, h: number, w: number): Promise<void> {
    const query = new URLSearchParams({ h: h.toString(), w: w.toString() }).toString();
    await this.request(`/containers/${id}/resize?${query}`, "POST");
  }

  /**
   * Attach to a container
   * @param id - Container ID or name
   * @param options - Attach options
   * @returns Attach connection
   */
  async attach(id: string, options?: AttachOptions): Promise<Response> {
    const params = new URLSearchParams();

    if (options?.detachKeys) params.append("detachKeys", options.detachKeys);
    if (options?.log) params.append("log", "true");
    if (options?.stream) params.append("stream", "true");
    if (options?.stdin) params.append("stdin", "true");
    if (options?.stdout) params.append("stdout", "true");
    if (options?.stderr) params.append("stderr", "true");

    const query = params.toString();
    return await this.request(
      `/containers/${id}/attach${query ? `?${query}` : ""}`,
      "POST"
    );
  }

  /**
   * Attach to a container via WebSocket
   * @param id - Container ID or name
   * @param options - Attach options
   * @returns WebSocket-like connection
   * @note Uses the attach endpoint with stream wrapping for compatibility with Unix sockets
   */
    async attachWebSocket(
    id: string,
    options?: AttachOptions
  ): Promise<DockerWebSocket> {
    const params = new URLSearchParams();

    if (options?.detachKeys) params.append("detachKeys", options.detachKeys);
    if (options?.stdin) params.append("stdin", "true");
    if (options?.stdout) params.append("stdout", "true");
    if (options?.stderr) params.append("stderr", "true");
    if (options?.stream) params.append("stream", "true");
    if (options?.log) params.append("logs", "true");

    const query = params.toString();
    const response = await this.request(
      `/containers/${id}/attach${query ? `?${query}` : ""}`,
      "POST"
    );

    const ws = new DockerWebSocket();
    ws.attach(response);

    return ws;
  }

  /**
   * Get an archive of a filesystem resource in a container
   * @param id - Container ID or name
   * @param path - Resource path in the container
   * @returns Archive stream
   */
  async getArchive(id: string, path: string): Promise<Response> {
    const query = new URLSearchParams({ path }).toString();
    return await this.request(
      `/containers/${id}/archive?${query}`,
      "GET"
    );
  }

  /**
   * Check if a file exists in a container
   * @param id - Container ID or name
   * @param path - Resource path in the container
   * @returns Archive info or null
   */
  async archiveInfo(id: string, path: string): Promise<ArchiveInfo | null> {
    const query = new URLSearchParams({ path }).toString();
    const res = await this.request(
      `/containers/${id}/archive?${query}`,
      "HEAD"
    );

    const dockerContentType = res.headers.get("X-Docker-Container-Path-Stat");
    if (!dockerContentType) return null;

    try {
      return JSON.parse(dockerContentType);
    } catch {
      return null;
    }
  }

  /**
   * Extract an archive of files or folders to a directory in the container
   * @param id - Container ID or name
   * @param path - Path to extract to
   * @param archive - Archive to extract
   * @param noOverwriteDirNonDir - If true, will not overwrite a dir with a non-dir
   * @param copyUIDGID - If set to true, copy ownership from archive to target
   */
  async putArchive(
    id: string,
    path: string,
    archive: BodyInit,
    noOverwriteDirNonDir: boolean = false,
    copyUIDGID: boolean = false
  ): Promise<void> {
    const params = new URLSearchParams();
    params.append("path", path);
    params.append("noOverwriteDirNonDir", noOverwriteDirNonDir.toString());
    params.append("copyUIDGID", copyUIDGID.toString());

    const query = params.toString();
    await this.request(`/containers/${id}/archive?${query}`, "PUT", archive);
  }

  /**
   * Create an exec instance
   * @param id - Container ID or name
   * @param options - Exec create options
   * @returns Exec create response with exec ID
   */
  async execCreate(
    id: string,
    options: ExecCreateOptions
  ): Promise<ExecCreateResponse> {
    const res = await this.request(`/containers/${id}/exec`, "POST", options);
    return await res.json() as ExecCreateResponse;
  }

  /**
   * Start an exec instance
   * @param id - Exec ID
   * @param options - Exec start options
   * @returns Exec stream
   */
  async execStart(id: string, options?: ExecStartOptions): Promise<Response> {
    const res = await this.request(`/exec/${id}/start`, "POST", options || {});
    return res;
  }

  /**
   * Inspect an exec instance
   * @param id - Exec ID
   * @returns Exec inspect response
   */
  async execInspect(id: string): Promise<ExecInspectResponse> {
    const res = await this.request(`/exec/${id}/json`, "GET");
    return await res.json() as ExecInspectResponse;
  }

  /**
   * Resize an exec TTY
   * @param id - Exec ID
   * @param h - Height of the TTY session
   * @param w - Width of the TTY session
   */
  async execResize(id: string, h: number, w: number): Promise<void> {
    const query = new URLSearchParams({ h: h.toString(), w: w.toString() }).toString();
    await this.request(`/exec/${id}/resize?${query}`, "POST");
  }

  /**
   * Delete stopped containers
   * @param options - Prune options
   * @returns Prune response with deleted containers and reclaimed space
   */
  async prune(options?: PruneContainersOptions): Promise<ContainerPruneResponse> {
    const params = new URLSearchParams();

    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters));
    }

    const query = params.toString();
    const res = await this.request(`/containers/prune${query ? `?${query}` : ""}`, "POST");
    return await res.json() as ContainerPruneResponse;
  }
}
