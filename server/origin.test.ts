import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./origin.ts";

function headers(values: Record<string, string>) {
  return new Headers(values);
}

describe("isSameOrigin", () => {
  it.each([
    ["http://localhost:3000", "localhost:3000"],
    ["http://192.168.1.20:3000", "192.168.1.20:3000"],
    ["https://alea.example.com", "alea.example.com"],
  ])("accepts %s on host %s", (origin, host) => {
    expect(isSameOrigin(headers({ origin, host }))).toBe(true);
  });

  it.each([
    [{ origin: "https://evil.example", host: "localhost:3000" }],
    [{ origin: "http://localhost:5173", host: "localhost:3000" }],
    [{ origin: "null", host: "localhost:3000" }],
    [{ host: "localhost:3000" }],
    [{ origin: "http://localhost:3000" }],
  ])("rejects %j", (values) => {
    expect(isSameOrigin(headers(values))).toBe(false);
  });
});
