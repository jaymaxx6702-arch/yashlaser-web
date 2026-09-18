import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://shop.yashlaser.in"),
  title: {
    default: "Yash Laser | Personal by Design · Established 1997",
    template: "%s | Yash Laser",
  },
  description:
    "Discover personalised acrylic photo standees, trophies, medals, keychains, I-cards and name plates at Yash Laser. Established 1997.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
