import { describe, expect, it } from "vitest";
import { applySm2, initialSrs, interleave } from "./srs";

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

describe("sm-2", () => {
  it("schedules a remembered word a day ahead, then six days", () => {
    const first = applySm2(initialSrs(NOW), 4, NOW);
    expect(first.repetitions).toBe(1);
    expect(first.interval).toBe(1);
    expect(first.ease).toBeCloseTo(2.5);
    expect(first.due).toBe(NOW + DAY);

    const second = applySm2(first, 4, first.due);
    expect(second.repetitions).toBe(2);
    expect(second.interval).toBe(6);
    expect(second.due).toBe(first.due + 6 * DAY);
  });

  it("raises ease for an easy grade and lowers it for a hard one", () => {
    expect(applySm2(initialSrs(NOW), 5, NOW).ease).toBeCloseTo(2.6);
    expect(applySm2(initialSrs(NOW), 3, NOW).ease).toBeCloseTo(2.36);
  });

  it("brings a forgotten word back after ten minutes", () => {
    const learned = applySm2(applySm2(initialSrs(NOW), 4, NOW), 4, NOW + DAY);
    const again = applySm2(learned, 0, NOW + DAY);
    expect(again.repetitions).toBe(0);
    expect(again.lapses).toBe(1);
    expect(again.due).toBe(NOW + DAY + 10 * 60 * 1000);
    expect(again.ease).toBeCloseTo(learned.ease);
  });

  it("mixes new cards into reviews", () => {
    expect(interleave<number | string>([1, 2, 3], ["a", "b"])).toEqual([1, 2, "a", 3, "b"]);
    expect(interleave([], ["a"])).toEqual(["a"]);
  });
});
