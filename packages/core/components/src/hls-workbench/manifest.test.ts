import { describe, expect, it } from "vitest";
import {
  findHlsFragment,
  HLS_MAX_MANIFEST_BYTES,
  parseHlsManifest,
  snapHlsBoundary,
} from "./manifest";

const base = "https://media.example/vod/part/index.m3u8?token=sample";
const sample =
  "#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:40\n#EXTINF:4.5,First\none.ts\n#EXTINF:6,Second\n../two.ts?key=test\n#EXTINF:3.5,Last\n/three.ts\n#EXT-X-ENDLIST\n";

describe("HLS media manifest inspection", () => {
  it("reads BOM/CRLF, exact durations, relative references and original EXTINF text", () => {
    const result = parseHlsManifest(
      `\uFEFF${sample.replaceAll("\n", "\r\n")}`,
      base,
    );
    expect(result.duration).toBe(14);
    expect(result.boundaries).toEqual([0, 4.5, 10.5, 14]);
    expect(result.fragments.map((part) => part.sequence)).toEqual([
      "40",
      "41",
      "42",
    ]);
    expect(result.fragments[1]).toMatchObject({
      startSeconds: 4.5,
      endSeconds: 10.5,
      uri: "../two.ts?key=test",
      resolvedUrl: "https://media.example/vod/two.ts?key=test",
      rawText: "#EXTINF:6,Second\n../two.ts?key=test",
    });
  });

  it("retains effective encryption/map context without interpreting IV query parameters", () => {
    const text = `#EXTM3U
#EXT-X-KEY:METHOD=AES-128,URI="key.bin?IV=mistaken,KEYFORMAT=bad",IV=0x12
#EXT-X-MAP:URI="init.mp4"
#EXTINF:2,
one.m4s
#EXT-X-KEY:METHOD=AES-128,URI="rotated.key?IV=still-not-attribute"
#EXT-X-DISCONTINUITY
#EXTINF:3,
two.m4s
#EXT-X-ENDLIST`;
    const second = parseHlsManifest(text, base).fragments[1]!;
    expect(second.sequence).toBe("1");
    expect(second.discontinuity).toBe(true);
    expect(second.mapKeyText).toContain("IV=0x12");
    expect(second.keyText).toContain("rotated.key");
    expect(second.rawText).toBe(
      `#EXT-X-KEY:METHOD=AES-128,URI="key.bin?IV=mistaken,KEYFORMAT=bad",IV=0x12\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-KEY:METHOD=AES-128,URI="rotated.key?IV=still-not-attribute"\n#EXT-X-DISCONTINUITY\n#EXTINF:3,\ntwo.m4s`,
    );
  });

  it("keeps uint64 sequence precision and rejects overflow", () => {
    const text = sample.replace("40", "18446744073709551613");
    expect(parseHlsManifest(text, base).fragments[2]!.sequence).toBe(
      "18446744073709551615",
    );
    expect(() =>
      parseHlsManifest(sample.replace("40", "18446744073709551615"), base),
    ).toThrow("媒体序号");
    const lastSequence =
      "#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:18446744073709551615\n#EXTINF:1,\nlast.ts\n#EXT-X-ENDLIST";
    expect(parseHlsManifest(lastSequence, base).fragments[0]?.sequence).toBe(
      "18446744073709551615",
    );
    expect(() =>
      parseHlsManifest(
        lastSequence.replace("18446744073709551615", "18446744073709551616"),
        base,
      ),
    ).toThrow("媒体序号");
  });

  it.each([
    sample.replace(
      "#EXT-X-MEDIA-SEQUENCE:40",
      "#EXT-X-MEDIA-SEQUENCE:40\n#EXT-X-MEDIA-SEQUENCE:41",
    ),
    sample
      .replace("#EXT-X-MEDIA-SEQUENCE:40\n", "")
      .replace(
        "#EXTINF:4.5,First",
        "#EXTINF:4.5,First\n#EXT-X-MEDIA-SEQUENCE:41",
      ),
    sample
      .replace("#EXT-X-MEDIA-SEQUENCE:40\n", "")
      .replace("one.ts", "one.ts\n#EXT-X-MEDIA-SEQUENCE:41"),
  ])("rejects duplicate or late media sequence declarations", (text) => {
    expect(() => parseHlsManifest(text, base)).toThrow(
      "媒体序号必须在片段前且只能声明一次",
    );
  });

  it("retains a valid identity AES-128 version and METHOD=NONE rotation", () => {
    const text = sample
      .replace(
        "#EXT-X-MEDIA-SEQUENCE:40",
        '#EXT-X-MEDIA-SEQUENCE:40\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin?IV=not-an-attribute,KEYFORMAT=bad",KEYFORMAT="identity",KEYFORMATVERSIONS="1"',
      )
      .replace(
        "../two.ts?key=test",
        "../two.ts?key=test\n#EXT-X-KEY:METHOD=NONE",
      );
    const result = parseHlsManifest(text, base);
    expect(result.fragments[0]?.keyText).toContain('KEYFORMATVERSIONS="1"');
    expect(result.fragments[2]?.keyText).toBe("#EXT-X-KEY:METHOD=NONE");
    expect(result.fragments[0]?.sequence).toBe("40");
  });

  it.each([
    'METHOD=AES-128,URI="key.bin",METHOD=NONE',
    'METHOD=AES-128,URI="first.key",URI="second.key"',
    'METHOD=AES-128,URI="key.bin",IV=0x1,IV=0x2',
    'METHOD=AES-128,URI="key.bin",KEYFORMAT="identity",KEYFORMAT="drm"',
    'METHOD=AES-128,URI="key.bin",BROKEN',
    'METHOD=AES-128,URI="key.bin",',
    'METHOD=AES-128,URI="key.bin"junk',
    'METHOD=AES-128,URI="key.bin",OTHER="value"junk',
    'METHOD=AES-128,URI=""',
    'METHOD=AES-128,URI="   "',
    "METHOD=AES-128,URI=key.bin",
    'METHOD=AES-128,URI="key.bin",KEYFORMATVERSIONS="2"',
    'METHOD=AES-128,URI="key.bin",KEYFORMATVERSIONS="1/2"',
    'METHOD=NONE,URI="key.bin"',
  ])(
    "rejects ambiguous, malformed and unsupported key attributes: %s",
    (raw) => {
      expect(() =>
        parseHlsManifest(
          sample.replace("#EXT-X-MEDIA-SEQUENCE:40", `#EXT-X-KEY:${raw}`),
          base,
        ),
      ).toThrow();
    },
  );

  it.each([
    'URI=""',
    'URI="   "',
    'URI="first.mp4",URI="second.mp4"',
    'URI="init.mp4",BROKEN',
    'URI="init.mp4"junk',
    'URI="init.mp4",',
    "URI=init.mp4",
    'BYTERANGE="100@0"',
  ])(
    "rejects invalid or ambiguous initialization map attributes: %s",
    (raw) => {
      expect(() =>
        parseHlsManifest(
          sample.replace("#EXT-X-MEDIA-SEQUENCE:40", `#EXT-X-MAP:${raw}`),
          base,
        ),
      ).toThrow();
    },
  );

  it("does not silently ignore a session key in a media playlist", () => {
    expect(() =>
      parseHlsManifest(
        sample.replace(
          "#EXT-X-MEDIA-SEQUENCE:40",
          '#EXT-X-SESSION-KEY:METHOD=AES-128,URI="session.key"',
        ),
        base,
      ),
    ).toThrow("EXT-X-SESSION-KEY");
  });

  it("uses the next fragment at a boundary and the last at media end", () => {
    const result = parseHlsManifest(sample, base);
    expect(findHlsFragment(result, -10)?.index).toBe(0);
    expect(findHlsFragment(result, 4.5)?.index).toBe(1);
    expect(findHlsFragment(result, 14)?.index).toBe(2);
    expect(findHlsFragment(result, NaN)).toBeUndefined();
    expect(snapHlsBoundary(result, 8)).toBe(10.5);
    expect(snapHlsBoundary(result, 7.5)).toBe(4.5);
    expect(snapHlsBoundary(result, -10)).toBe(0);
    expect(snapHlsBoundary(result, 100)).toBe(14);
  });

  it.each([
    "#EXT-X-BYTERANGE:100@0",
    '#EXT-X-MAP:URI="init.mp4",BYTERANGE="100@0"',
    '#EXT-X-PART:DURATION=1,URI="a.ts"',
    "#EXT-X-GAP",
    '#EXT-X-DEFINE:NAME="x",VALUE="a"',
    '#EXT-X-KEY:METHOD=SAMPLE-AES,URI="key.bin"',
    '#EXT-X-KEY:METHOD=AES-128,URI="key.bin",KEYFORMAT="drm"',
    '#EXT-X-KEY:METHOD=AES-128,URI="key.bin",IV=bad',
    '#EXT-X-KEY:METHOD=AES-128,URI="key.bin?IV=ignored"\n#EXT-X-MAP:URI="init.mp4"',
  ])("rejects unsupported or unsafe semantics: %s", (tag) => {
    expect(() =>
      parseHlsManifest(sample.replace("#EXT-X-MEDIA-SEQUENCE:40", tag), base),
    ).toThrow();
  });

  it.each(["0", "-1", "NaN", "Infinity", "0x10", "604801", "", "1e999"])(
    "rejects invalid duration %s",
    (raw) => {
      expect(() =>
        parseHlsManifest(sample.replace("4.5,First", `${raw},First`), base),
      ).toThrow("时长");
    },
  );

  it("rejects live/master/incomplete media and unsafe URI schemes", () => {
    expect(() =>
      parseHlsManifest(sample.replace("#EXT-X-ENDLIST\n", ""), base),
    ).toThrow("点播");
    expect(() =>
      parseHlsManifest(
        "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nmedia.m3u8",
        base,
      ),
    ).toThrow("主播放列表");
    expect(() =>
      parseHlsManifest(sample.replace("one.ts\n", ""), base),
    ).toThrow("缺少地址");
    expect(() =>
      parseHlsManifest(sample.replace("one.ts", "javascript:alert(1)"), base),
    ).toThrow("HTTP(S)");
    expect(() =>
      parseHlsManifest(sample, "https://name:secret@media.example/index.m3u8"),
    ).toThrow("HTTP(S)");
    expect(() => parseHlsManifest("not a manifest", base)).toThrow("M3U8");
  });

  it("bounds manifest bytes, segment count and accumulated duration", () => {
    expect(() =>
      parseHlsManifest(
        "中".repeat(Math.ceil(HLS_MAX_MANIFEST_BYTES / 3)),
        base,
      ),
    ).toThrow("4 MiB");
    const many = `#EXTM3U\n${"#EXTINF:1,\na.ts\n".repeat(50_001)}#EXT-X-ENDLIST`;
    expect(() => parseHlsManifest(many, base)).toThrow("50,000");
    expect(() =>
      parseHlsManifest(sample.replace("4.5,First", "604799,First"), base),
    ).toThrow("时长");
  });
});
