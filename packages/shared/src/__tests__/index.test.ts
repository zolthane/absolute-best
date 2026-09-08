import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "../index";

describe("shared package", () => {
  it("exports its own name, proving the workspace and test runner are wired up", () => {
    expect(PACKAGE_NAME).toBe("@teeter/shared");
  });
});
