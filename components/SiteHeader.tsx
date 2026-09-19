"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CART_EVENT, cartCount } from "@/lib/cart";
import { isUiLanguage, uiCopy } from "@/lib/i18n";
import { Brand } from "./Brand";
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const path = usePathname();
  const firstSegment = path.split("/").filter(Boolean)[0] || "";
  const lang = isUiLanguage(firstSegment) ? firstSegment : "en";
  const copy = uiCopy[lang];
  const prefix = isUiLanguage(firstSegment) ? "/" + lang : "";
  const localHref = (value: string) => prefix + value;
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
        Personalised expressions. Lasting impressions.{" "}
        <span>Established 1997</span>
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
            {open ? "Close −" : "Menu +"}
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
            <Link href={prefix ? localHref("/products") : "/#our-story"}>{copy.story}</Link>
            <Link href="/contact">{copy.contact}</Link>
            <Link href="/track-order" aria-current={path === "/track-order" ? "page" : undefined}>
              {copy.trackOrder}
            </Link>
            <Link href="/cart" aria-current={path === "/cart" ? "page" : undefined}>
              {copy.cart}{count ? ` (${count})` : ""}
            </Link>
            <Link href={localHref("/products")} className="nav-cta">
              {copy.explore} <span aria-hidden="true">↗</span>
            </Link>
                      <div className="language-links" aria-label="Language">
              <Link href="/products">EN</Link>
              <Link href="/gu/products">ગુજરાતી</Link>
              <Link href="/hi/products">हिन्दी</Link>
              <Link href="/mr/products">मराठी</Link>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
