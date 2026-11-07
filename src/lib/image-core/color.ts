import type { Rgb } from "./frame.ts";

export type { Rgb };

/**
 * Resolves a hex color (#rgb, #rrggbb, with or without #) to an RGB object.
 * Returns null for anything else. Shared by the tools that take hex input.
 */
export const hexToRgb = (hex: string): Rgb | null => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const digits = match[1];
  if (digits.length === 3) {
    return {
      r: parseInt(digits[0] + digits[0], 16),
      g: parseInt(digits[1] + digits[1], 16),
      b: parseInt(digits[2] + digits[2], 16),
    };
  }
  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16),
  };
};
