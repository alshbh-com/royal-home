import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const eventSchema = z.object({
  event_type: z.enum(["page_view", "product_view", "add_to_cart", "begin_checkout", "purchase"]),
  session_id: z.string().min(1).max(100),
  product_id: z.string().uuid().optional().nullable(),
  path: z.string().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => eventSchema.parse(d))
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const ua = (getRequestHeader("user-agent") ?? "").substring(0, 500);
    await supabaseAdmin.from("analytics_events").insert({
      event_type: data.event_type,
      session_id: data.session_id,
      product_id: data.product_id ?? null,
      path: data.path ?? null,
      ip_address: ip,
      user_agent: ua,
      metadata: data.metadata ?? {},
    });
    return { ok: true };
  });
