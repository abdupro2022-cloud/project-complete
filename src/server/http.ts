import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { ProviderError, isProviderError } from "@/lib/providers/types";
import { redact } from "./vault";

/**
 * Shared HTTP helpers.
 *
 * Every API route returns the same envelope, so the client has exactly one
 * error path. A failure always carries: what happened, why, and what the user
 * can do next. There is no "Something went wrong" anywhere in this file.
 */

export interface Ok<T> {
  ok: true;
  data: T;
  /** Present when a real provider served the call. */
  mode: "live" | "demo";
}

export interface Err {
  ok: false;
  error: {
    code: string;
    message: string;
    /** What the user should do next. */
    remedy: "configure" | "retry" | "wait" | "none";
    retryable: boolean;
    providerId?: string;
  };
}

export type Envelope<T> = Ok<T> | Err;

export function ok<T>(data: T, mode: "live" | "demo" = "live"): NextResponse<Envelope<T>> {
  return NextResponse.json({ ok: true, data, mode } satisfies Ok<T>);
}

export function fail(
  code: string,
  message: string,
  opts: { remedy?: Err["error"]["remedy"]; retryable?: boolean; providerId?: string; status?: number } = {},
): NextResponse<Envelope<never>> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        remedy: opts.remedy ?? "none",
        retryable: opts.retryable ?? false,
        ...(opts.providerId ? { providerId: opts.providerId } : {}),
      },
    } satisfies Err,
    { status: opts.status ?? 400 },
  );
}

/**
 * Wraps a route handler. Converts thrown ProviderErrors into the envelope,
 * maps Zod failures to a field-level message, and never leaks a stack trace.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (e) {
      if (isProviderError(e)) {
        const err = e as ProviderError;
        const status =
          err.code === "not_configured" ? 412
          : err.code === "rate_limited" ? 429
          : err.code === "invalid_key" ? 401
          : err.code === "server" ? 502
          : err.code === "network" ? 504
          : 400;
        // redact() guards against a key that slipped into an error message.
        return fail(err.code, redact(err.userMessage), {
          remedy: err.remedy,
          retryable: err.retryable,
          providerId: err.providerId,
          status,
        });
      }
      if (e instanceof z.ZodError) {
        const first = e.issues[0];
        const path = first?.path.join(".") ?? "";
        return fail(
          "validation",
          `المُدخل غير صالح${path ? ` في الحقل «${path}»` : ""}: ${first?.message ?? "تحقق من القيم المُدخلة."}`,
          { remedy: "none", status: 422 },
        );
      }
      // Unexpected: log a redacted trace server-side, return something useful.
      console.error("[api] unhandled error:", redact((e as Error)?.message ?? String(e)));
      return fail(
        "internal",
        "حدث خطأ داخلي غير متوقع. أعد المحاولة، وإن تكرّر فسجّل الخطأ في صفحة السجلات.",
        { remedy: "retry", retryable: true, status: 500 },
      );
    }
  };
}

/** Reads and validates a JSON body. */
export async function body<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new z.ZodError([
      { code: "custom", path: [], message: "جسم الطلب ليس JSON صالحًا." },
    ]);
  }
  return schema.parse(raw);
}

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

export const aiSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(32_000),
      }),
    )
    .min(1)
    .max(60),
  capability: z
    .enum(["writing", "analysis", "research_synthesis", "extraction", "fast", "vision"])
    .default("writing"),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(16_000).optional(),
  model: z.string().max(120).optional(),
  json: z.boolean().optional(),
  /** Which provider to prefer; falls back to the routing table. */
  prefer: z.enum(["gemini", "deepseek", "openrouter", "auto"]).default("auto"),
});

export const searchSchema = z.object({
  query: z.string().min(2, "الاستعلام قصير جدًا.").max(500),
  depth: z.enum(["basic", "advanced"]).default("advanced"),
  maxResults: z.number().int().min(1).max(20).default(8),
});

export const urlSchema = z.object({
  url: z
    .string()
    .min(8, "الرابط قصير جدًا.")
    .max(2000)
    .refine((u) => {
      try {
        const p = new URL(u);
        return p.protocol === "http:" || p.protocol === "https:";
      } catch {
        return false;
      }
    }, "الرابط غير صالح. يجب أن يبدأ بـ https:// أو http://"),
});

export const youtubeSearchSchema = z.object({
  query: z.string().min(2, "الاستعلام قصير جدًا.").max(300),
  maxResults: z.number().int().min(1).max(25).default(8),
});

export const keySchema = z.object({
  integrationId: z
    .enum([
      "gemini", "deepseek", "openrouter", "tavily", "firecrawl",
      "youtube", "video_to_text", "google_sheets", "notion",
    ]),
  value: z.string().min(8, "المفتاح قصير جدًا.").max(400),
  /** Optional provider-specific fields (endpoint URL, model name, ids). */
  config: z.record(z.string().max(200), z.string().max(2000)).optional(),
});
