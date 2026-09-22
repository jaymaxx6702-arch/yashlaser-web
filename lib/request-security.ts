export class RequestBodyError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readJsonBody<T = unknown>(
  request: Request,
  maxBytes: number,
): Promise<T | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new RequestBodyError("Request body is too large.", 413);

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes)
    throw new RequestBodyError("Request body is too large.", 413);

  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new RequestBodyError("Invalid JSON request.", 400);
  }
}


export async function readBinaryBody(
  request: Request,
  maxBytes: number,
): Promise<{ body: Uint8Array; mimeType: string }> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new RequestBodyError("Request body is too large.", 413);

  const mimeType =
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ||
    "";
  const reader = request.body?.getReader();
  if (!reader) return { body: new Uint8Array(), mimeType };

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // Ignore cancellation errors; the request is already rejected.
        }
        throw new RequestBodyError("Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body, mimeType };
}
