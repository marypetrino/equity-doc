import { fmtK } from "./format";

export const C = {
  green: "rgba(0,163,158,0.85)",
  greenBg: "rgba(0,163,158,0.18)",
  accent: "rgba(85,70,214,0.85)",
  accentBg: "rgba(85,70,214,0.15)",
  orange: "rgba(217,154,46,0.85)",
  orangeBg: "rgba(217,154,46,0.15)",
  red: "rgba(224,82,77,0.65)",
  text: "#6b6e7e",
  grid: "rgba(180,184,200,0.4)",
} as const;

export const fontSm = { family: "DM Sans", size: 10 } as const;
export const fontMono = { family: "DM Mono", size: 11 } as const;

export const defX = {
  ticks: { color: C.text, font: fontSm },
  grid: { color: C.grid },
};

export const defY = {
  ticks: {
    color: C.text,
    font: fontMono,
    callback: (v: number | string) => fmtK(Number(v)),
  },
  grid: { color: C.grid },
};

export const defLegend = {
  labels: { color: C.text, font: { family: "DM Sans", size: 11 } },
};
