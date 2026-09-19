"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function sendAnalyticsEvent(payload: Record<string, unknown>) {
  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the shopping experience.
  }
}

export function PageAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    sendAnalyticsEvent({
      eventName: "page_view",
      path: pathname,
    });
  }, [pathname]);

  return null;
}

export function SearchAnalytics({
  query,
  resultCount,
  path,
}: {
  query: string;
  resultCount: number;
  path: string;
}) {
  useEffect(() => {
    if (!query) return;
    sendAnalyticsEvent({
      eventName: "search",
      searchQuery: query,
      resultCount,
      path,
    });
  }, [query, resultCount, path]);

  return null;
}

export function ProductViewAnalytics({
  productId,
  path,
}: {
  productId: string;
  path: string;
}) {
  useEffect(() => {
    sendAnalyticsEvent({
      eventName: "product_view",
      productId,
      path,
    });
  }, [productId, path]);

  return null;
}
