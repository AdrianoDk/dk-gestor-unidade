import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BASE = "https://dkapi.dksoft.com.br";

/** Proxy to the DKSOFT API: the token travels in the request body (never in a URL) and is only forwarded as a Bearer header. */
export const dkFetch = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        path: z.string().regex(/^\/api\/v1\/[A-Za-z0-9_\-/.@%]*$/),
        params: z.record(z.string(), z.string()).optional(),
        token: z.string().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const url = new URL(BASE + data.path);
    for (const [k, v] of Object.entries(data.params ?? {})) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${data.token}`, Accept: "application/json" },
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, ok: res.ok, body: body as any };
  });
