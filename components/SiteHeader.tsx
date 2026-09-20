"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CART_EVENT, cartCount } from "@/lib/cart";
import { isUiLanguage, uiCopy } from "@/lib/i18n";
import { Brand } from "./Brand";

const announcementCopy = {
  en: { line: "Personalised expressions. Lasting impressions.", established: "Established 1997", menu: "Menu +", close: "Close −" },
  gu: { line: "વ્યક્તિગત અભિવ્યક્તિ. લાંબી છાપ.", established: "સ્થાપના 1997", menu: "મેનુ +", close: "બંધ −" },
  hi: { line: "व्यक्तिगत अभिव्यक्ति। यादगार छाप।", established: "स्थापित 1997", menu: "मेनू +", close: "बंद −" },
  mr: { line: "वैयक्तिक अभिव्यक्ती. दीर्घकाळ टिकणारी छाप.", established: "स्थापना 1997", menu: "मेनू +", close: "बंद −" },
} as const;

const localizedUtilityPaths = new Set([
  "/",
  "/products",
  "/contact",
  "/track-order",
  "/cart",
  "/checkout",
  "/bulk-orders",
  "/plan-my-event",
  "/custom-acrylic",
  "/support",
  "/reviews",
  "/privacy",
]);

function isLocalizedPath(path: string) {
  return (
    localizedUtilityPaths.has(path) ||
    path.startsWith("/products/") ||
    path.startsWith("/categories/")
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const path = usePathname();
  const firstSegment = path.split("/").filter(Boolean)[0] || "";
  const lang = isUiLanguage(firstSegment) ? firstSegment : "en";
  const copy = uiCopy[lang];
  const extra = announcementCopy[lang];
  const prefix = isUiLanguage(firstSegment) ? "/" + lang : "";
  const localHref = (value: string) => (lang === "en" ? value : prefix + value);

  const languageHref = (target: string) => {
    const segments = path.split("/").filter(Boolean);
    const bare = isUiLanguage(segments[0] || "")
      ? "/" + segments.slice(1).join("/")
      : path;

    const normalized = bare === "" ? "/" : bare;
    if (!isLocalizedPath(normalized))
      return target === "en" ? "/products" : "/" + target + "/products";

    if (target === "en") return normalized;
    return normalized === "/" ? "/" + target : "/" + target + normalized;
  };

  useEffect(() => {
    const sync = () => setCount(cartCount());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <>
      <div className="announcement">
        {extra.line} <span>{extra.established}</span>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <button
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? extra.close : extra.menu}
          </button>
          <nav
            id="main-navigation"
            className={`main-nav ${open ? "is-open" : ""}`}
            aria-label="Main navigation"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <Link href={localHref("/")} aria-current={path === localHref("/") ? "page" : undefined}>
              {copy.home}
            </Link>
            <Link
              href={localHref("/products")}
              aria-current={path === localHref("/products") ? "page" : undefined}
            >
              {copy.collection}
            </Link>
            <Link href={localHref("/") + "#our-story"}>{copy.story}</Link>
            <Link href={localHref("/contact")}>{copy.contact}</Link>
            <Link
              href={localHref("/track-order")}
              aria-current={path === localHref("/track-order") ? "page" : undefined}
            >
              {copy.trackOrder}
            </Link>
            <Link href={localHref("/cart")} aria-current={path === localHref("/cart") ? "page" : undefined}>
              {copy.cart}{count ? ` (${count})` : ""}
            </Link>
            <Link href="/account" aria-current={path.startsWith("/account") ? "page" : undefined}>
              {copy.account}
            </Link>
            <Link href={localHref("/products")} className="nav-cta">
              {copy.explore} <span aria-hidden="true">↗</span>
            </Link>
            <div className="language-links" aria-label="Language">
              <Link href={languageHref("en")}>EN</Link>
              <Link href={languageHref("gu")}>ગુજરાતી</Link>
              <Link href={languageHref("hi")}>हिन्दी</Link>
              <Link href={languageHref("mr")}>मराठी</Link>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
