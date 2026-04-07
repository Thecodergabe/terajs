import { describe, it, expect } from "vitest";
import { parseSFC } from "@terajs/sfc";

describe("SFC <ai> block", () => {
  it("parses simple AI metadata", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <ai>
        summary: This is a test
        keywords: test, terajs
      </ai>
      `,
      "/components/AiTest.nbl"
    );

    expect(sfc.ai?.summary).toBe("This is a test");
    expect(sfc.ai?.keywords).toEqual(["test", "terajs"]);
  });

  it("handles empty <ai> block", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <ai></ai>
      `,
      "/components/EmptyAi.nbl"
    );

    expect(sfc.ai?.summary).toBeUndefined();
    expect(sfc.ai?.keywords).toBeUndefined();
  });
});

