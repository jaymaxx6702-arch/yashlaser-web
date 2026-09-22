import { NextResponse } from "next/server";
import {
  AI_INPUT_MAX_BYTES,
  aiImageToolsEnabled,
  removeBackgroundWithProvider,
} from "@/lib/ai-image-server";
import { CUSTOMIZATION_ARTWORK_POLICY } from "@/lib/customization/file-policy";
import {
  consumeRequestRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { RequestBodyError, readBinaryBody } from "@/lib/request-security";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!aiImageToolsEnabled())
    return NextResponse.json(
      { error: "Background removal is not enabled yet." },
      { status: 503 },
    );

  if (
    !(await consumeRequestRateLimit(
      request,
      "ai_background_remove_ip",
      12,
      600,
    ))
  )
    return rateLimitResponse(600);

  let input: { body: Uint8Array; mimeType: string };
  try {
    input = await readBinaryBody(request, AI_INPUT_MAX_BYTES);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image." },
      { status },
    );
  }

  if (
    !input.body.byteLength ||
    !CUSTOMIZATION_ARTWORK_POLICY.mimeTypes.includes(
      input.mimeType as (typeof CUSTOMIZATION_ARTWORK_POLICY.mimeTypes)[number],
    )
  )
    return NextResponse.json(
      { error: "Choose a valid JPG, PNG or WebP image." },
      { status: 400 },
    );

  try {
    const result = await removeBackgroundWithProvider(
      input.body,
      input.mimeType,
    );
    return new Response(result.body, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Background removal is temporarily unavailable." },
      { status: 502 },
    );
  }
}
