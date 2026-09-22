export const customizationSeedProductIds = [
  "yl-33190722", // Customized 3D Single Person Photo Standee
  "yl-31593509", // 427 - Premium Acrylic Award
  "yl-33190739", // Professional Acrylic Desk Name Plate with photo
] as const;

export const customizationSeedExpectations = {
  "yl-33190722": { categoryId: "standees", requiresImage: true },
  "yl-31593509": { categoryId: "awards", requiresImage: false },
  "yl-33190739": { categoryId: "name-plates", requiresImage: false },
} as const;
