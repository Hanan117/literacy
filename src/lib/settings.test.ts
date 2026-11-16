import { describe, expect, test } from "bun:test";
import {
  BIO_MAX_LENGTH,
  DEFAULT_PRIVACY,
  describeUserAgent,
  estimateReadingMinutes,
  formatReadingHours,
  initials,
  readPrivacyMetadata,
  readProfileMetadata,
  strengthScore,
  validateProfileInput,
} from "./settings";

describe("initials", () => {
  test("takes the first letter of the first and last word", () => {
    expect(initials("Ahmad Sanusi Kurator")).toBe("AK");
  });

  test("falls back to the email prefix", () => {
    expect(initials(null, "ahmad.kurator@litera.id")).toBe("A");
  });

  test("falls back to L when nothing usable exists", () => {
    expect(initials("", "  ")).toBe("L");
  });
});

describe("estimateReadingMinutes", () => {
  test("uses percentage of the estimated duration", () => {
    expect(
      estimateReadingMinutes([
        { percentage: 50, estimatedMinutes: 120, pageCount: 100 },
      ])
    ).toBe(60);
  });

  test("falls back to two minutes per page", () => {
    expect(
      estimateReadingMinutes([
        { percentage: 25, estimatedMinutes: null, pageCount: 100 },
      ])
    ).toBe(50);
  });

  test("clamps percentages and sums rows", () => {
    expect(
      estimateReadingMinutes([
        { percentage: 150, estimatedMinutes: 60, pageCount: 10 },
        { percentage: -10, estimatedMinutes: 60, pageCount: 10 },
      ])
    ).toBe(60);
  });
});

describe("formatReadingHours", () => {
  test("shows hours when at least one hour was read", () => {
    expect(formatReadingHours(8520)).toBe("142 jam");
  });

  test("shows minutes below one hour", () => {
    expect(formatReadingHours(45)).toBe("45 menit");
  });

  test("shows zero minutes for empty accounts", () => {
    expect(formatReadingHours(0)).toBe("0 menit");
  });
});

describe("strengthScore", () => {
  test("marks an empty password", () => {
    expect(strengthScore("")).toEqual({ level: 0, label: "Belum diisi" });
  });

  test("scores short passwords as weak", () => {
    expect(strengthScore("abc")).toEqual({ level: 1, label: "Lemah" });
  });

  test("scores eight characters as fair", () => {
    expect(strengthScore("abcdefgh")).toEqual({ level: 2, label: "Cukup Baik" });
  });

  test("scores twelve characters as strong", () => {
    expect(strengthScore("abcdefghijkl")).toEqual({ level: 3, label: "Kuat" });
  });

  test("scores a long mixed password as very strong", () => {
    expect(strengthScore("Abcdefgh123!xy").label).toBe("Sangat Kuat");
    expect(strengthScore("Abcdefgh123!xy").level).toBe(4);
  });
});

describe("validateProfileInput", () => {
  test("accepts and normalizes a valid profile", () => {
    expect(
      validateProfileInput({
        name: "  Ahmad Kurator ",
        handle: "Ahmad.Kurator",
        bio: " Peminat sastra ",
      })
    ).toEqual({
      ok: true,
      value: {
        name: "Ahmad Kurator",
        handle: "ahmad.kurator",
        bio: "Peminat sastra",
      },
    });
  });

  test("rejects a too short name", () => {
    const result = validateProfileInput({ name: "A", handle: "ahmad", bio: "" });
    expect(result.ok).toBe(false);
  });

  test("rejects handles with spaces or symbols", () => {
    expect(
      validateProfileInput({ name: "Ahmad", handle: "ahmad kurator", bio: "" }).ok
    ).toBe(false);
    expect(
      validateProfileInput({ name: "Ahmad", handle: "ahmad!", bio: "" }).ok
    ).toBe(false);
  });

  test("rejects a bio over the limit", () => {
    const result = validateProfileInput({
      name: "Ahmad",
      handle: "ahmad",
      bio: "a".repeat(BIO_MAX_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
  });
});

describe("metadata readers", () => {
  test("reads profile strings and ignores junk", () => {
    expect(
      readProfileMetadata({ handle: "ahmad.kurator", bio: "Halo" })
    ).toEqual({ handle: "ahmad.kurator", bio: "Halo" });
    expect(readProfileMetadata({ handle: 42, bio: null })).toEqual({
      handle: "",
      bio: "",
    });
  });

  test("merges stored privacy flags over defaults", () => {
    expect(
      readPrivacyMetadata({ privacy: { spoilerBlur: false } })
    ).toEqual({ ...DEFAULT_PRIVACY, spoilerBlur: false });
    expect(readPrivacyMetadata({})).toEqual(DEFAULT_PRIVACY);
  });
});

describe("describeUserAgent", () => {
  test("describes chrome on macOS", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
      )
    ).toBe("Chrome di macOS");
  });

  test("describes safari on iPhone", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
      )
    ).toBe("Safari di iPhone");
  });

  test("describes edge on windows", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0"
      )
    ).toBe("Edge di Windows");
  });

  test("falls back for unknown agents", () => {
    expect(describeUserAgent("")).toBe("Peramban ini");
  });
});
