/** Currency / number formatting for calculators */

export function fmt(n: number, d = 0) {
  return (
    "$" +
    n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
  );
}

export function fmtK(n: number) {
  if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return fmt(n);
}

export function pct(n: number, d = 2) {
  return (n * 100).toFixed(d) + "%";
}

/** Formats a numeric string with commas for display, preserving decimals */
export function addCommas(raw: string): string {
  const stripped = raw.replace(/,/g, "");
  const dotIndex = stripped.indexOf(".");
  if (dotIndex !== -1) {
    const intPart = stripped.slice(0, dotIndex);
    const decPart = stripped.slice(dotIndex);
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return formatted + decPart;
  }
  return stripped.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
