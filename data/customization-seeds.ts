export const customizationSeeds = [
  {
    id: "yl-33214839",
    sourceId: 33214839,
    sourceUrl: "https://www.yashlaser.in/product/couple-hd-photo-cutout",
    slug: "couple-standee-photo-cut-out",
    name: "Couple standee photo cut out",
    categoryId: "standees",
    subcategoryId: "photo-standees",
    pricingMode: "from",
    variants: [
      {
        id: "7439120",
        name: "8 inch",
        available: true,
        effectivePriceMinor: 76300,
      },
      {
        id: "7439121",
        name: "10 inch",
        available: true,
        effectivePriceMinor: 110700,
      },
      {
        id: "7439122",
        name: "12 inch",
        available: true,
        effectivePriceMinor: 145900,
      },
    ],
  },
  {
    id: "yl-31748751",
    sourceId: 31748751,
    sourceUrl: "https://www.yashlaser.in/product/custom-acrylic-name-plate",
    slug: "custom-elegant-acrylic-name-plate-12x4",
    name: "Custom Elegant Acrylic Name Plate (12x4\")",
    categoryId: "name-plates",
    subcategoryId: "door-name-plates",
    pricingMode: "fixed",
    variants: [
      {
        id: "7410147",
        name: "12x4",
        available: true,
        effectivePriceMinor: 24500,
      },
    ],
  },
  {
    id: "yl-31593509",
    sourceId: 31593509,
    sourceUrl: "https://www.yashlaser.in/product/427-premium-acrylic-award-medal-plaque-memento-shield",
    slug: "427-premium-acrylic-award-medal-plaque-memento-shield",
    name: "427 - Premium Acrylic Award Medal Plaque Memento Shield",
    categoryId: "awards",
    subcategoryId: "acrylic-awards",
    pricingMode: "from",
    variants: [
      {
        id: "7060511",
        name: "8x3.25",
        available: true,
        effectivePriceMinor: 14000,
      },
      {
        id: "7060512",
        name: "9x3.75",
        available: true,
        effectivePriceMinor: 18000,
      },
      {
        id: "7060513",
        name: "10x4",
        available: true,
        effectivePriceMinor: 21000,
      },
    ],
  },
] as const;

export const customizationSeedIds = customizationSeeds.map((seed) => seed.id);
