import { trackEvent } from "@/serverfn/analytics.functions";

const KEY = "royal_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function track(
  event_type: "page_view" | "product_view" | "add_to_cart" | "begin_checkout" | "purchase",
  opts: { product_id?: string | null; path?: string | null; metadata?: Record<string, any> } = {}
) {
  if (typeof window === "undefined") return;
  // Fire-and-forget
  trackEvent({
    data: {
      event_type,
      session_id: getSessionId(),
      product_id: opts.product_id ?? null,
      path: opts.path ?? window.location.pathname,
      metadata: opts.metadata ?? {},
    },
  }).catch(() => {});
}
