import { describe, expect, it } from "vitest";
import { worldToScreen } from "../camera";
import { computeFocusCamera } from "../focus";

interface TestItem {
  score: number;
}

function evenlySpacedItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, i) => ({ score: i }));
}

describe("computeFocusCamera", () => {
  it("centres the camera exactly on the target's score", () => {
    const items = evenlySpacedItems(200);
    const target = items[100];
    if (!target) throw new Error("fixture error");

    const camera = computeFocusCamera(target, items, 1500);
    expect(camera.center).toBe(target.score);
  });

  it("picks a zoom that includes roughly 20 neighbours each side", () => {
    const items = evenlySpacedItems(200);
    const target = items[100];
    if (!target) throw new Error("fixture error");
    const viewportWidth = 1500;

    const camera = computeFocusCamera(target, items, viewportWidth);

    const leftNeighbourScreenX = worldToScreen(80, camera, viewportWidth); // 20 below
    const rightNeighbourScreenX = worldToScreen(120, camera, viewportWidth); // 20 above
    expect(leftNeighbourScreenX).toBeGreaterThanOrEqual(0);
    expect(leftNeighbourScreenX).toBeLessThanOrEqual(viewportWidth);
    expect(rightNeighbourScreenX).toBeGreaterThanOrEqual(0);
    expect(rightNeighbourScreenX).toBeLessThanOrEqual(viewportWidth);

    // A neighbour well beyond 20 away should not be comfortably on screen -
    // proves the zoom isn't just "fit everything".
    const farScreenX = worldToScreen(180, camera, viewportWidth);
    expect(farScreenX).toBeGreaterThan(viewportWidth);
  });

  it("still produces a finite, positive zoom when the item has fewer than 20 neighbours", () => {
    const items = evenlySpacedItems(5);
    const target = items[0];
    if (!target) throw new Error("fixture error");

    const camera = computeFocusCamera(target, items, 1500);
    expect(Number.isFinite(camera.zoom)).toBe(true);
    expect(camera.zoom).toBeGreaterThan(0);
  });

  it("does not produce a zero-width view when every item shares the target's score", () => {
    const items: TestItem[] = [{ score: 7 }, { score: 7 }, { score: 7 }];
    const camera = computeFocusCamera(items[0] as TestItem, items, 1500);
    expect(camera.center).toBe(7);
    expect(Number.isFinite(camera.zoom)).toBe(true);
    expect(camera.zoom).toBeGreaterThan(0);
  });
});
