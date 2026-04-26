import { fmtK } from "./format";

export const C = {
  green: "rgba(0,206,201,0.85)",
  greenBg: "rgba(0,206,201,0.15)",
  accent: "rgba(108,92,231,0.85)",
  accentBg: "rgba(108,92,231,0.15)",
  orange: "rgba(253,203,110,0.85)",
  orangeBg: "rgba(253,203,110,0.15)",
  red: "rgba(255,107,107,0.6)",
  text: "#8b8d9e",
  grid: "rgba(42,45,62,0.6)",
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
