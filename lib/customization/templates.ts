import type { TemplateId } from "./rules";
export type Box = { x: number; y: number; width: number; height: number };
export type Template = {
  id: TemplateId;
  name: string;
  ratio: number;
  shape: "rounded" | "circle" | "shield";
  photo: Box;
  text: [Box, Box];
  base: boolean;
};
const portrait = { x: 0.09, y: 0.08, width: 0.82, height: 0.65 };
export const templates: Record<TemplateId, Template> = {
  standee: {
    id: "standee",
    name: "Photo standee",
    ratio: 0.76,
    shape: "rounded",
    photo: portrait,
    text: [
      { x: 0.06, y: 0.76, width: 0.88, height: 0.09 },
      { x: 0.06, y: 0.87, width: 0.88, height: 0.07 },
    ],
    base: true,
  },
  trophy: {
    id: "trophy",
    name: "Trophy / award",
    ratio: 0.8,
    shape: "shield",
    photo: { x: 0.18, y: 0.13, width: 0.64, height: 0.43 },
    text: [
      { x: 0.12, y: 0.6, width: 0.76, height: 0.12 },
      { x: 0.17, y: 0.75, width: 0.66, height: 0.1 },
    ],
    base: true,
  },
  medal: {
    id: "medal",
    name: "Medal",
    ratio: 1,
    shape: "circle",
    photo: { x: 0.2, y: 0.17, width: 0.6, height: 0.43 },
    text: [
      { x: 0.15, y: 0.62, width: 0.7, height: 0.12 },
      { x: 0.23, y: 0.77, width: 0.54, height: 0.07 },
    ],
    base: false,
  },
  keychain: {
    id: "keychain",
    name: "Round keychain",
    ratio: 1,
    shape: "circle",
    photo: { x: 0.18, y: 0.12, width: 0.64, height: 0.5 },
    text: [
      { x: 0.15, y: 0.65, width: 0.7, height: 0.12 },
      { x: 0.24, y: 0.79, width: 0.52, height: 0.07 },
    ],
    base: false,
  },
  "id-card": {
    id: "id-card",
    name: "Portrait I-card",
    ratio: 0.63,
    shape: "rounded",
    photo: { x: 0.23, y: 0.14, width: 0.54, height: 0.4 },
    text: [
      { x: 0.07, y: 0.61, width: 0.86, height: 0.12 },
      { x: 0.07, y: 0.77, width: 0.86, height: 0.1 },
    ],
    base: false,
  },
  "name-plate": {
    id: "name-plate",
    name: "Name plate",
    ratio: 2.5,
    shape: "rounded",
    photo: { x: 0.04, y: 0.14, width: 0.22, height: 0.72 },
    text: [
      { x: 0.3, y: 0.22, width: 0.65, height: 0.24 },
      { x: 0.3, y: 0.57, width: 0.65, height: 0.2 },
    ],
    base: false,
  },
  keepsake: {
    id: "keepsake",
    name: "Custom keepsake",
    ratio: 1,
    shape: "rounded",
    photo: { x: 0.1, y: 0.1, width: 0.8, height: 0.55 },
    text: [
      { x: 0.08, y: 0.69, width: 0.84, height: 0.11 },
      { x: 0.08, y: 0.84, width: 0.84, height: 0.08 },
    ],
    base: false,
  },
};
export function frameFor(template: Template): Box {
  const height = Math.min(730, 800 / template.ratio);
  const width = height * template.ratio;
  return { x: (1000 - width) / 2, y: 110 + (730 - height) / 2, width, height };
}
export function relativeBox(frame: Box, box: Box): Box {
  return {
    x: frame.x + box.x * frame.width,
    y: frame.y + box.y * frame.height,
    width: box.width * frame.width,
    height: box.height * frame.height,
  };
}
