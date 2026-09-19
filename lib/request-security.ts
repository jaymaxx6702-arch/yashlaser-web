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
