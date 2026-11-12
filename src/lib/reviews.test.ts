import { describe, expect, test } from "bun:test";
import {
  RATING_LABELS,
  buildDistribution,
  displayAuthorName,
  formatReviewDate,
  starFill,
  validateReviewInput,
} from "./reviews";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

describe("RATING_LABELS", () => {
  test("labels each rating from 1 to 5", () => {
    expect(RATING_LABELS[1]).toBe("Kurang");
    expect(RATING_LABELS[5]).toBe("Mahakarya");
  });
});

describe("starFill", () => {
  test("returns a partial fill for the last star", () => {
    expect(starFill(4.9, 4)).toBe(90);
  });

  test("clamps between 0 and 100", () => {
    expect(starFill(5, 0)).toBe(100);
    expect(starFill(0, 3)).toBe(0);
    expect(starFill(5.2, 4)).toBe(100);
  });
});

describe("buildDistribution", () => {
  test("returns five buckets ordered from 5 down to 1", () => {
    const result = buildDistribution(
      [
        { rating: 5, count: 3 },
        { rating: 4, count: 1 },
      ],
      4
    );

    expect(result.map((bucket) => bucket.rating)).toEqual([5, 4, 3, 2, 1]);
    expect(result.map((bucket) => bucket.count)).toEqual([3, 1, 0, 0, 0]);
    expect(result.map((bucket) => bucket.percent)).toEqual([75, 25, 0, 0, 0]);
  });

  test("handles an empty total without dividing by zero", () => {
    const result = buildDistribution([], 0);

    expect(result).toHaveLength(5);
    expect(result.every((bucket) => bucket.percent === 0)).toBe(true);
  });
});

describe("formatReviewDate", () => {
  test("labels today and yesterday", () => {
    expect(formatReviewDate(new Date())).toBe("Hari ini");
    expect(formatReviewDate(daysAgo(1))).toBe("Kemarin");
  });

  test("labels recent days", () => {
    expect(formatReviewDate(daysAgo(3))).toBe("3 hari yang lalu");
  });

  test("labels one and many weeks", () => {
    expect(formatReviewDate(daysAgo(7))).toBe("1 pekan yang lalu");
    expect(formatReviewDate(daysAgo(14))).toBe("2 pekan yang lalu");
  });
});

describe("validateReviewInput", () => {
  test("rejects ratings outside 1 to 5", () => {
    expect(validateReviewInput({ rating: 0, title: "Judul", body: "Isi ulasan yang cukup panjang." }).ok).toBe(false);
    expect(validateReviewInput({ rating: 6, title: "Judul", body: "Isi ulasan yang cukup panjang." }).ok).toBe(false);
  });

  test("rejects short title and body", () => {
    expect(validateReviewInput({ rating: 5, title: "ab", body: "Isi ulasan yang cukup panjang." }).ok).toBe(false);
    expect(validateReviewInput({ rating: 5, title: "Judul", body: "terlalu pendek" }).ok).toBe(false);
  });

  test("trims a valid input and normalizes an empty quote", () => {
    const result = validateReviewInput({
      rating: "4",
      title: "  Judul refleksi  ",
      body: "  Isi ulasan yang cukup panjang untuk lolos validasi.  ",
      quote: "   ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        rating: 4,
        title: "Judul refleksi",
        body: "Isi ulasan yang cukup panjang untuk lolos validasi.",
        quote: null,
      });
    }
  });
});

describe("displayAuthorName", () => {
  test("falls back to a capitalized email prefix", () => {
    expect(displayAuthorName(null, "budi@mail.com")).toBe("Budi");
    expect(displayAuthorName("   ", "sari@mail.com")).toBe("Sari");
  });

  test("uses the provided name", () => {
    expect(displayAuthorName("  Reza Pratama ", "reza@mail.com")).toBe("Reza Pratama");
  });
});
