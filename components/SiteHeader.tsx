"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CART_EVENT, cartCount } from "@/lib/cart";
import { Brand } from "./Brand";
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const path = usePathname();
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
            <Link href="/" aria-current={path === "/" ? "page" : undefined}>
              Home
            </Link>
            <Link
              href="/products"
              aria-current={path === "/products" ? "page" : undefined}
            >
              Our collection
            </Link>
            <Link href="/#our-story">Our story</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/track-order" aria-current={path === "/track-order" ? "page" : undefined}>
              Track order
            </Link>
            <Link href="/cart" aria-current={path === "/cart" ? "page" : undefined}>
              Cart{count ? ` (${count})` : ""}
            </Link>
            <Link href="/products" className="nav-cta">
              Explore products <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
