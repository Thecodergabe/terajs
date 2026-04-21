import { describe, expect, it } from "vitest";
import { computeNextRepoVersion, detectReleaseType } from "./releaseVersioning.mjs";

describe("detectReleaseType", () => {
  it("detects patch, minor, and major changes", () => {
    expect(detectReleaseType("1.0.0", "1.0.1")).toBe("patch");
    expect(detectReleaseType("1.0.0", "1.1.0")).toBe("minor");
    expect(detectReleaseType("1.0.0", "2.0.0")).toBe("major");
  });
});

describe("computeNextRepoVersion", () => {
  it("catches the repo release marker up to the highest public package version", () => {
    expect(computeNextRepoVersion({
      previousRepoVersion: "1.0.5",
      currentPublicVersions: ["1.1.0", "1.0.0", "1.0.0"],
      versionChanges: [
        {
          name: "@terajs/devtools",
          previousVersion: "1.0.0",
          nextVersion: "1.1.0"
        }
      ]
    })).toBe("1.1.0");
  });

  it("still advances the repo release marker when a lower-series package is the only thing that changed", () => {
    expect(computeNextRepoVersion({
      previousRepoVersion: "1.1.2",
      currentPublicVersions: ["1.1.2", "1.0.6", "1.0.0"],
      versionChanges: [
        {
          name: "@terajs/cli",
          previousVersion: "1.0.5",
          nextVersion: "1.0.6"
        }
      ]
    })).toBe("1.1.3");
  });

  it("returns null when no public package version changed", () => {
    expect(computeNextRepoVersion({
      previousRepoVersion: "1.1.2",
      currentPublicVersions: ["1.1.2", "1.0.5"],
      versionChanges: []
    })).toBeNull();
  });
});