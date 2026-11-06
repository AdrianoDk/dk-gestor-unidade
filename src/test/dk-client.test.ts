import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAcademicTotal, isCancel, splitRange } from "@/lib/dk-client";
import { dkFetch } from "@/lib/dk-api";

vi.mock("@/lib/dk-api", () => ({ dkFetch: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

describe("course cancellations", () => {
  it("identifies inactive I courses as cancelled, not C or active A", () => {
    expect(isCancel("I")).toBe(true);
    expect(isCancel("C")).toBe(false);
    expect(isCancel("A")).toBe(false);
    expect(isCancel(null)).toBe(false);
  });

  it("uses cancellation event totals across inclusive chunks of at most 31 days", async () => {
    vi.mocked(dkFetch)
      .mockResolvedValueOnce({ ok: true, status: 200, body: { total_cancelamentos: 2 } })
      .mockResolvedValueOnce({ ok: true, status: 200, body: { total_cancelamentos: 3 } });
    expect(await fetchAcademicTotal("test-token", "cancelamentos", "2026-10-01", "2026-11-01")).toBe(5);
    expect(vi.mocked(dkFetch).mock.calls.map(([input]) => input.data)).toEqual([
      { token: "test-token", path: "/api/v1/cancelamentos/periodo", params: { data_inicial: "2026-10-01", data_final: "2026-10-31" } },
      { token: "test-token", path: "/api/v1/cancelamentos/periodo", params: { data_inicial: "2026-11-01", data_final: "2026-11-01" } },
    ]);
  });

  it("uses actual enrollment totals rather than student registrations", async () => {
    vi.mocked(dkFetch).mockResolvedValue({ ok: true, status: 200, body: { total_matriculas: 4 } });
    expect(await fetchAcademicTotal("test-token", "matriculas", "2026-11-01", "2026-11-06")).toBe(4);
    expect(dkFetch).toHaveBeenCalledWith({ data: { token: "test-token", path: "/api/v1/matriculas/periodo", params: { data_inicial: "2026-11-01", data_final: "2026-11-06" } } });
  });
});

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
