import { fetch, type BodyInit, type TLSOptions } from "bun"
import { BunDocker } from ".."

type TODO = any

export class SocketHandler {
  UNIX_PATH = BunDocker.DOCKER_SOCKET
  TLS_ACTIVE = BunDocker.TLS_ACTIVE
  CERT_FILE = BunDocker.CERT_FILE
  CA_FILE = BunDocker.CA_FILE
  KEY_FILE = BunDocker.KEY_FILE
  ENABLE_API = BunDocker.ENABLE_API
  HOST_NAME = "localhost"

  TLS_OPTIONS: TLSOptions | undefined

  constructor() {
    this._buildTlsOptions()
  }

  private fetchHandler(path: string, method: "POST" | "GET" | "HEAD" | "DELETE" | "PUT", body?: BodyInit) {
    const url = `http://localhost${path}`;

    return fetch(url, {
        unix: this.UNIX_PATH,
        method,
        body,
        tls: this.TLS_OPTIONS,
        headers: {
          // You might need 'Host' header for some TLS setups
          "Host": "localhost",
          "Content-Type": "application/json",
        }
      });
  }

  private _buildTlsOptions() {
    if (this.TLS_ACTIVE) {
      this.TLS_OPTIONS = {
        ca: this.CA_FILE !== null ? Bun.file(this.CA_FILE) : undefined,
        cert: this.CERT_FILE !== null ? Bun.file(this.CERT_FILE) : undefined,
        key: this.KEY_FILE !== null ? Bun.file(this.KEY_FILE) : undefined
      }
    }
  }

  private container() {
    return {
      containerActions.create, // NOT YET IMPLEMENTED
      containerActions.start, // NOT YET IMPLEMENTED
      containerActions.stop, // NOT YET IMPLEMENTED
    }
  }
}
