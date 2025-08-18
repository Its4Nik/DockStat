import { sleep } from "./config";
const BASE_URL = process.env.OUTLINE_BASE_URL || "https://app.getoutline.com";
const API_KEY = process.env.OUTLINE_API_KEY || "";
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

async function outlineRequest(
  endpoint: string,
  body: any,
  retries = 3,
): Promise<any> {
  const url = `${BASE_URL}/api/${endpoint}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        const backoff = 1000 * (attempt + 1);
        console.warn(`Rate limited. backing off ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      const json = await res.json();
      if (!res.ok) {
        console.error(
          `[Outline] ${res.status} ${endpoint} payload=`,
          body,
          "response=",
          json,
        );
        throw new Error(
          `Outline API error ${res.status}: ${JSON.stringify(json)}`,
        );
      }
      return json;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      console.warn(
        `Request failed (attempt ${attempt + 1}): ${err}. Retrying...`,
      );
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
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
  return out;
}

export async function fetchDocumentInfo(documentId: string) {
  const json = await outlineRequest("documents.info", { id: documentId });
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
  return json.data;
}
