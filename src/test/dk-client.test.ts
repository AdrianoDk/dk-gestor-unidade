import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAcademicTotal, fetchFinance, isCancel } from "@/lib/dk-client";
import { defaultRange, PERIOD_LIMIT_MESSAGE, rangeError } from "@/lib/dk-range";
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

  it("uses cancellation event totals for a 31-day inclusive period", async () => {
    vi.mocked(dkFetch).mockResolvedValueOnce({ ok: true, status: 200, body: { total_cancelamentos: 2 } });
    expect(await fetchAcademicTotal("test-token", "cancelamentos", "2026-10-01", "2026-10-31")).toBe(2);
    expect(vi.mocked(dkFetch).mock.calls.map(([input]) => input?.data)).toEqual([
      { token: "test-token", path: "/api/v1/cancelamentos/periodo", params: { data_inicial: "2026-10-01", data_final: "2026-10-31" } },
    ]);
  });

  it("uses actual enrollment totals rather than student registrations", async () => {
    vi.mocked(dkFetch).mockResolvedValue({ ok: true, status: 200, body: { total_matriculas: 4 } });
    expect(await fetchAcademicTotal("test-token", "matriculas", "2026-11-01", "2026-11-06")).toBe(4);
    expect(dkFetch).toHaveBeenCalledWith({ data: { token: "test-token", path: "/api/v1/matriculas/periodo", params: { data_inicial: "2026-11-01", data_final: "2026-11-06" } } });
  });
});

describe("date selection", () => {
  it("defaults to today only", () => {
    expect(defaultRange(new Date(2026, 10, 8, 13, 55))).toEqual({ start: "2026-11-08", end: "2026-11-08" });
  });
  it("accepts 31 days including both endpoints", () => {
    expect(rangeError({ start: "2026-10-01", end: "2026-10-31" })).toBeNull();
    expect(rangeError({ start: "2026-11-08", end: "2026-11-08" })).toBeNull();
  });
  it("rejects 32 days including both endpoints", () => {
    expect(rangeError({ start: "2026-10-01", end: "2026-11-01" })).toBe(PERIOD_LIMIT_MESSAGE);
  });
  it.each(["matriculas", "cancelamentos"] as const)("blocks oversized %s queries without API calls", async (kind) => {
    await expect(fetchAcademicTotal("test-token", kind, "2026-10-01", "2026-11-01")).rejects.toThrow(PERIOD_LIMIT_MESSAGE);
    expect(dkFetch).not.toHaveBeenCalled();
  });
  it.each(["contas-recebidas", "contas-pagas"] as const)("blocks oversized %s queries without API calls", async (kind) => {
    await expect(fetchFinance("test-token", kind, "2026-10-01", "2026-11-01")).rejects.toThrow(PERIOD_LIMIT_MESSAGE);
    expect(dkFetch).not.toHaveBeenCalled();
  });
  it("sends the selected valid financial period unchanged", async () => {
    vi.mocked(dkFetch).mockResolvedValue({ ok: true, status: 200, body: { registros: [] } });
    expect(await fetchFinance("test-token", "contas-recebidas", "2026-10-01", "2026-10-31")).toEqual([]);
    expect(dkFetch).toHaveBeenCalledExactlyOnceWith({ data: { token: "test-token", path: "/api/v1/financeiro/contas-recebidas", params: { data_inicial: "2026-10-01", data_final: "2026-10-31" } } });
  });
  it("rejects missing or reversed dates", () => {
    expect(rangeError({ start: "", end: "2026-11-08" })).not.toBeNull();
    expect(rangeError({ start: "2026-11-09", end: "2026-11-08" })).not.toBeNull();
  });
});
