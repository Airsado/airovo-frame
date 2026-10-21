/** A strict boundary for stored values and caller-supplied presets. */
export function normalizeHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const hex = value.trim().toLowerCase();
  if (/^#[\da-f]{3}$/.test(hex)) {
    return `#${Array.from(hex.slice(1), (digit) => digit.repeat(2)).join("")}`;
  }
  if (!/^#[\da-f]{6}([\da-f]{2})?$/.test(hex)) return undefined;
  return hex.length === 9 && hex.endsWith("ff") ? hex.slice(0, 7) : hex;
}

export function normalizeColorPresets(
  values: readonly string[],
  showAlpha = false,
): string[] {
  return [
    ...new Set(
      values.flatMap((value) => {
        const hex = normalizeHexColor(value);
        return hex ? [showAlpha ? hex : hex.slice(0, 7)] : [];
      }),
    ),
  ];
}
