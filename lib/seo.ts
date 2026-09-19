import { business } from "@/data/business";

export function languageAlternates(path: string) {
  return {
    en: business.url + path,
    gu: business.url + "/gu" + path,
    hi: business.url + "/hi" + path,
    mr: business.url + "/mr" + path,
    "x-default": business.url + path,
  };
}

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: business.name,
  url: business.url,
  foundingDate: String(business.established),
  email: business.email,
  telephone: business.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Swagat Residency, Kamalpur",
    addressLocality: "Prantij",
    addressRegion: "Gujarat",
    postalCode: "383205",
    addressCountry: "IN",
  },
};
