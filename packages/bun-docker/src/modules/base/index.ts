import { type BodyInit, type HeadersInit } from "bun";
import { type ConnectionConfig, type HttpMethod } from "./types";

export class BaseModule {
  constructor(private config: ConnectionConfig) {}

  async request(
    path: string,
    method: HttpMethod = "GET",
    body?: BodyInit | Record<string, any>,
    headers?: HeadersInit
  ) {
    let url: string;
    let options: BunFetchRequestInit = {
      method,
      headers: {
        "Host": "localhost", // Default, overwritten below if needed
        ...(typeof body === 'object' && body !== null && { "Content-Type": "application/json" }),
        ...(headers || {})
      }
    };

    if (typeof body === 'object' && !(body instanceof FormData) && body !== undefined) {
      options.body = JSON.stringify(body);
    } else {
      options.body = body as BodyInit;
    }


    if (this.config.mode === 'unix') {
      url = `http://localhost${path}`;
      options.unix = this.config.socketPath;
    } else {
      url = `${this.config.baseUrl}${path}`;

      try {
        const urlObj = new URL(url);
        options.headers = { ...options.headers, "Host": urlObj.host };
      } catch(e) {
        // Ignore parsing errors
      }
    }

    if (this.config.tls) {
      options.tls = this.config.tls;
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Docker API Error (${response.status}): ${text}`);
    }

    return response;
  }
}
