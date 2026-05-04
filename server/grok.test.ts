import { describe, expect, it } from "vitest";

describe("Grok API Key Validation", () => {
  it("should have GROK_API_KEY environment variable set", () => {
    const apiKey = process.env.GROK_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);
    expect(apiKey!.startsWith("gsk_")).toBe(true);
  });

  it("should be able to reach x.ai endpoint", async () => {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new Error("GROK_API_KEY not set");
    }

    const response = await fetch("https://api.x.ai/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Even if key is invalid, we should get a response from the endpoint
    expect(response.status).toBeLessThan(500);
  });
});
