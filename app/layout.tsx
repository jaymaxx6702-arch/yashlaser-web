import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { organizationStructuredData } from "@/lib/seo";
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData).replace(/</g, "\\u003c"),
          }}
        />
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
