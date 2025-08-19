import { sleep } from "./config";
const BASE_URL = process.env.OUTLINE_BASE_URL || "https://app.getoutline.com";
const API_KEY = process.env.OUTLINE_API_KEY || "";
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

import { logger } from "../bin/cli";

/**
 * Make a POST request to the Outline API with simple retry/backoff logic.
 */
async function outlineRequest(
  endpoint: string,
  body: any,
  retries = 3,
): Promise<any> {
  const url = `${BASE_URL}/api/${endpoint}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      logger.debug(`Outline request: POST ${url} (attempt ${attempt + 1})`);
      logger.debug(`Payload (trimmed): ${JSON.stringify(body, null, 2)}`);

      const res = await fetch(url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const backoff = 1000 * (attempt + 1);
        logger.warn(
          `Rate limited by Outline API. Backing off ${backoff}ms (attempt ${attempt + 1}).`,
        );
        await sleep(backoff);
        continue;
      }

      let json: any;
      try {
        json = await res.json();
      } catch (parseErr) {
        logger.error(
          `Failed to parse JSON response from ${endpoint}: ${parseErr}`,
        );
        throw parseErr;
      }

      if (!res.ok) {
        // Log useful context but avoid leaking sensitive headers/keys
        logger.error(
          `[Outline@${BASE_URL}/api/${endpoint}] HTTP ${res.status} - payload=${JSON.stringify(body)} response=${JSON.stringify(json)}`,
        );
        throw new Error(
          `Outline API error ${res.status}: ${JSON.stringify(json)}`,
        );
      }

      logger.debug(
        `Outline response for ${endpoint} (attempt ${attempt + 1}): ${JSON.stringify(json).slice(0, 200)}${JSON.stringify(json).length > 200 ? "..." : ""}`,
      );
      return json;
    } catch (err: any) {
      // last attempt -> rethrow
      if (attempt === retries - 1) {
        logger.error(
          `Request to Outline failed after ${retries} attempts: ${err?.message ?? err}`,
        );
        throw err;
      }
      const backoff = 500 * (attempt + 1);
      logger.warn(
        `Request failed (attempt ${attempt + 1}): ${err?.message ?? err}. Retrying after ${backoff}ms...`,
      );
      await sleep(backoff);
    }
  }

  // Should be unreachable, but keep the error for TypeScript
  throw new Error("outlineRequest: unreachable");
}

export async function listCollectionsPaged(): Promise<
  { id: string; name: string }[]
> {
  const out: { id: string; name: string }[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const json = await outlineRequest("collections.list", { offset, limit });
    const data = json.data || [];
    for (const c of data) out.push({ id: c.id, name: c.name });
    if (data.length < limit) break;
    offset += data.length;
  }
  logger.debug(`listCollectionsPaged: returned ${out.length} collections`);
  return out;
}

export async function listDocumentsInCollection(
  collectionId: string,
): Promise<any[]> {
  const out: any[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const json = await outlineRequest("documents.list", {
      collectionId,
      offset,
      limit,
    });
    const data = json.data || [];
    for (const d of data) out.push(d);
    if (data.length < limit) break;
    offset += data.length;
  }
  logger.debug(
    `listDocumentsInCollection(${collectionId}): returned ${out.length} documents`,
  );
  return out;
}

export async function fetchDocumentInfo(documentId: string) {
  const json = await outlineRequest("documents.info", { id: documentId });
  logger.debug(`fetchDocumentInfo(${documentId}) -> ${json ? "ok" : "null"}`);
  return json.data ?? null;
}

export async function createDocument(
  title: string,
  text: string,
  collectionId: string,
  parentDocumentId: string | null,
) {
  const payload = {
    title,
    text,
    collectionId,
    parentDocumentId: parentDocumentId || null,
    publish: true,
  };
  const json = await outlineRequest("documents.create", payload);
  logger.info(
    `Created document "${title}" in collection ${collectionId} (id=${json?.id ?? "unknown"})`,
  );
  return json.data;
}

export async function updateDocument(
  id: string,
  title: string | undefined,
  text: string,
) {
  const payload: any = { id, text, publish: true };
  if (title) payload.title = title;
  const json = await outlineRequest("documents.update", payload);
  logger.info(`Updated document id=${id}${title ? ` title="${title}"` : ""}`);
  return json.data;
}
