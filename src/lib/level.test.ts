import { describe, expect, it } from "vitest";
import { adaptLevel, levelFromPlacement } from "./level";

describe("placement", () => {
  it("stops at the first band below half right", () => {
    expect(
      levelFromPlacement([
        { level: "A0", ok: true },
        { level: "A0", ok: true },
        { level: "A1", ok: true },
        { level: "A1", ok: false },
        { level: "A2", ok: false },
        { level: "A2", ok: false },
      ]),
    ).toBe("A1");
  });

  it("stays at the first step when the basics miss", () => {
    expect(
      levelFromPlacement([
        { level: "A0", ok: false },
        { level: "A0", ok: false },
      ]),
    ).toBe("A0");
  });

  it("reaches the top band when every band is at least half right", () => {
    expect(
      levelFromPlacement([
        { level: "A0", ok: true },
        { level: "A0", ok: true },
        { level: "A1", ok: true },
        { level: "A1", ok: true },
        { level: "A2", ok: true },
        { level: "A2", ok: false },
        { level: "B1", ok: true },
        { level: "B1", ok: true },
        { level: "B2", ok: true },
        { level: "B2", ok: true },
      ]),
    ).toBe("B2");
  });
});

describe("adaptivity", () => {
  const ok = (flag: boolean) => ({ at: 1, ok: flag });

  it("moves up after consistently strong reviews", () => {
    expect(adaptLevel("A1", Array.from({ length: 10 }, () => ok(true)))).toBe("A2");
    expect(adaptLevel("B2", Array.from({ length: 10 }, () => ok(true)))).toBe("B2");
  });

  it("moves down after frequent misses and waits for enough evidence", () => {
    expect(adaptLevel("A2", Array.from({ length: 10 }, () => ok(false)))).toBe("A1");
    expect(adaptLevel("A0", Array.from({ length: 10 }, () => ok(false)))).toBe("A0");
    expect(adaptLevel("A1", Array.from({ length: 9 }, () => ok(true)))).toBe("A1");
    expect(adaptLevel("A1", [...Array.from({ length: 8 }, () => ok(true)), ok(false), ok(false)])).toBe("A1");
  });
});
