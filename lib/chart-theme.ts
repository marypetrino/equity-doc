import { fmtK } from "./format";

export const C = {
  green: "rgba(10,158,122,0.85)",
  greenBg: "rgba(10,158,122,0.12)",
  accent: "rgba(108,92,231,0.85)",
  accentBg: "rgba(108,92,231,0.12)",
  orange: "rgba(208,139,0,0.85)",
  orangeBg: "rgba(208,139,0,0.12)",
  red: "rgba(217,63,63,0.6)",
  text: "#6b7085",
  grid: "rgba(221,224,234,0.8)",
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
