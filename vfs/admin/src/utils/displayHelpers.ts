export const fmtQty = (v: number): string => v % 1 === 0 ? String(v) : v.toFixed(1);
