import Logger from "@dockstat/logger";
import { Glob } from "bun";
import { Elysia, t } from "elysia";
import { dockStackLogger } from "../..";
import {
  ErrorCodes,
  type ErrorResponse,
  HttpStatus,
  type SuccessResponse,
} from "../types";
import { getDefaultAuthKey } from "../utils/getDefaultAuthKey";

const DEFAULT_PSK = await getDefaultAuthKey();
const DEFAULT_CONFIG_FILE = "./.auth_config.enc";
const DEFAULT_CONFIG_ENC_KEY_ENV = "CONFIG_ENC_KEY"; // recommended env var for encryption key material

export const createSuccessResponse = <T = undefined>(
  message: string,
  data?: T
): SuccessResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

const createErrorResponse = (
  message: string,
  code: string,
  details?: string
): ErrorResponse => ({
  success: false,
  message,
  timestamp: new Date().toISOString(),
  error: { code, details },
});

/* ---------- crypto helpers (Web Crypto PBKDF2 -> AES-GCM) ---------- */

function toBase64(buf: Uint8Array) {
  return Buffer.from(buf).toString("base64");
}
function fromBase64(s: string) {
  return new Uint8Array(Buffer.from(s, "base64"));
}

async function deriveKeyFromPassphrase(passphrase: string, salt: BufferSource) {
  const enc = new TextEncoder().encode(passphrase);
  const baseKey = await crypto.subtle.importKey("raw", enc, "PBKDF2", false, [
    "deriveKey",
  ]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 150_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

async function encryptJson(obj: unknown, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const plain = new TextEncoder().encode(JSON.stringify(obj));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "", iv }, key, plain)
  );
  return JSON.stringify({
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(ct),
  });
}

async function decryptJson<T = undefined>(
  serialized: string,
  passphrase: string
): Promise<T> {
  const parsed = JSON.parse(serialized);
  const salt = fromBase64(parsed.salt);
  const iv = fromBase64(parsed.iv);
  const data = fromBase64(parsed.data);
  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const plainBuf = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
  );
  return JSON.parse(new TextDecoder().decode(plainBuf)) as T;
}

/* ---------- file helpers using Bun.file / Bun.write ---------- */

async function readConfigFile(path: string): Promise<string | null> {
  try {
    const f = Bun.file(path);
    // Bun.file(...) returns File object even if not exists; check exists() to be safe.
    // Some Bun versions support f.exists; fallback to try/catch on .text()
    // Using try/catch here to keep compatibility.
    return await f.text();
  } catch (_: unknown) {
    return null;
  }
}

async function writeConfigFile(path: string, content: string) {
  // Bun.write is recommended/fast (docs). Overwrites the file.
  await Bun.write(path, content);
}

/* ---------- Type for stored config ---------- */
export interface StoredAuthConfig {
  psk: string;
  // add other fields you want stored, e.g. allowList, metadata, etc.
  [k: string]: unknown;
}

type ignoredRoutes = string[];

/* ---------- The plugin factory ---------- */

export const authPlugin = (options?: {
  psk?: string;
  ignoredRoutes: ignoredRoutes;
  headerName?: string;
  configFile?: string;
}) => {
  const HEADER_NAME = options?.headerName ?? "X-API-Key";
  const CONFIG_FILE = options?.configFile ?? DEFAULT_CONFIG_FILE;

  // encryption passphrase used to encrypt/decrypt the config on disk.
  // strongly recommend setting CONFIG_ENC_KEY env var to a random 32+ byte string.
  const ENC_PASSPHRASE =
    process.env[DEFAULT_CONFIG_ENC_KEY_ENV] ?? options?.psk ?? DEFAULT_PSK;
  if (!process.env[DEFAULT_CONFIG_ENC_KEY_ENV]) {
    dockStackLogger.warn(
      `⚠️ CONFIG_ENC_KEY not set — falling back to PSK for config encryption. In production set ${DEFAULT_CONFIG_ENC_KEY_ENV} env var.`
    );
  }

  let currentPSK = String(options?.psk ?? process.env.AUTH_PSK ?? DEFAULT_PSK);

  // try to load stored config (if exists) and set currentPSK from it
  (async function tryLoadOnStartup() {
    try {
      const data = await readConfigFile(CONFIG_FILE);
      if (!data) return;
      const obj = await decryptJson<StoredAuthConfig>(data, ENC_PASSPHRASE);
      if (obj?.psk) {
        currentPSK = String(obj.psk);
        dockStackLogger.info(
          "authPlugin: loaded config from disk (psk updated)."
        );
      } else {
        dockStackLogger.warn("authPlugin: config file found but no psk field.");
      }
    } catch (err) {
      dockStackLogger.warn(
        `authPlugin: failed to read/decrypt config file: ${err}`
      );
    }
  })();

  const plugin = new Elysia({ name: "auth-plugin" })
    // POST /__auth/config -> open only when currentPSK === DEFAULT_PSK
    .post(
      "/__auth/config",
      async (context) => {
        // body schema validated below
        const { body, set } = context;
        // If config is already set (not default), close this endpoint.
        if (currentPSK !== DEFAULT_PSK) {
          set.status = HttpStatus.FORBIDDEN;
          return createErrorResponse(
            "Config endpoint closed",
            ErrorCodes.FORBIDDEN,
            "Configuration has already been initialized"
          );
        }

        // Expect a body like: { psk: "my-secret", ...otherConfig }
        const newConfig = body as StoredAuthConfig;

        if (!newConfig?.psk || newConfig.psk === DEFAULT_PSK) {
          set.status = HttpStatus.BAD_REQUEST;
          return createErrorResponse(
            "Invalid config",
            ErrorCodes.VALIDATION_ERROR,
            "Provide a non-default psk in the config"
          );
        }

        // encrypt and write to disk
        try {
          const serialized = await encryptJson(newConfig, ENC_PASSPHRASE);
          await writeConfigFile(CONFIG_FILE, serialized);
          currentPSK = String(newConfig.psk);
          dockStackLogger.info(
            "authPlugin: config written and PSK rotated from default."
          );
          return createSuccessResponse("Config saved, PSK rotated", {
            pskSet: true,
          });
        } catch (err) {
          set.status = HttpStatus.INTERNAL_SERVER_ERROR;
          return createErrorResponse(
            "Failed to persist config",
            ErrorCodes.INTERNAL_SERVER_ERROR,
            `${err}`
          );
        }
      },
      {
        body: t.Object({
          psk: t.String(),
        }),
      }
    )
    // optionally expose a GET to check whether config is set. (not sensitive)
    .get("/__auth/config/status", async () => {
      const isDefault = currentPSK === DEFAULT_PSK;
      return createSuccessResponse("status", { isDefault });
    })
    // derive auth object into context (scoped)
    .derive({ as: "scoped" }, async ({ request }) => {
      // headers keys are lowercase in Elysia (but use provided header name to look up)
      const headerLookup = HEADER_NAME.toLowerCase();
      const apiKey = String(request.headers.get(headerLookup) ?? "");

      // constant-time compare
      const isAuthenticated = (() => {
        if (!apiKey || apiKey.length !== currentPSK.length) return false;
        let result = 0;
        for (let i = 0; i < currentPSK.length; i++) {
          result |= apiKey.charCodeAt(i) ^ currentPSK.charCodeAt(i);
        }
        return result === 0;
      })();

      return {
        auth: {
          isAuthenticated,
          clientId: isAuthenticated ? `client-${Date.now()}` : undefined,
          timestamp: new Date().toISOString(),
        },
      };
    })
    // block requests that are not authenticated *except* the config endpoint while PSK is default
    .onBeforeHandle({ as: "scoped" }, ({ auth, request, set }) => {
      // allow access to the config POST path when still using default PSK
      const url = String(request.url ?? "");
      const isConfigPush =
        url.endsWith("/__auth/config") && request.method === "POST";

      if (currentPSK === DEFAULT_PSK && isConfigPush) {
        // allow - this is the temporary open endpoint
        return;
      }

      if (!auth?.isAuthenticated) {
        set.status = HttpStatus.UNAUTHORIZED;
        return createErrorResponse(
          "Authentication required",
          ErrorCodes.UNAUTHORIZED,
          `Please provide a valid ${HEADER_NAME} header`
        );
      }
    });

  return plugin;
};
