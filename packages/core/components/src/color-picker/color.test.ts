import { describe, expect, it } from "vitest";
import { normalizeColorPresets, normalizeHexColor } from "./color";

describe("HEX color boundaries", () => {
  it.each([
    [" #F0A ", "#ff00aa"],
    ["#C2410C", "#c2410c"],
    ["#12345680", "#12345680"],
    ["#123456ff", "#123456"],
    ["#00000000", "#00000000"],
  ])("normalizes %s to %s", (input, output) => {
    expect(normalizeHexColor(input)).toBe(output);
  });
  it.each([
    undefined,
    null,
    0,
    "",
    "red",
    "#abcd",
    "#12345",
    "#123456789",
    "#gggggg",
    "url(x)",
  ])("rejects invalid values: %s", (input) =>
    expect(normalizeHexColor(input)).toBeUndefined(),
  );
  it("drops invalid and equivalent presets and honors alpha support", () => {
    const presets = ["#fff", "#ffffff", "#FFFFFFff", "broken", "#ffffff80"];
    expect(normalizeColorPresets(presets)).toEqual(["#ffffff"]);
    expect(normalizeColorPresets(presets, true)).toEqual([
      "#ffffff",
      "#ffffff80",
    ]);
  });
});
