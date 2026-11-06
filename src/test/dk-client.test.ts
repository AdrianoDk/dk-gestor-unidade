import { describe, expect, it } from "vitest";
import { splitRange } from "@/lib/dk-client";

describe("splitRange (API limit of 31 days)", () => {
  it("keeps a 31-day range as one chunk", () => {
    expect(splitRange("2026-10-01", "2026-10-31")).toEqual([["2026-10-01", "2026-10-31"]]);
  });
  it("splits a 32-day range in two", () => {
    expect(splitRange("2026-10-01", "2026-11-01")).toEqual([
      ["2026-10-01", "2026-10-31"],
      ["2026-11-01", "2026-11-01"],
    ]);
  });
});
