import { describe, it, expect, vi, afterEach } from "vitest";
import { parseJsonWithMarkdownStrip } from "@/services/api";

describe("parseJsonWithMarkdownStrip()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses a plain JSON string normally", () => {
    const json = JSON.stringify({ file_id: "abc", condition: { cloth_details: {} } });
    expect(parseJsonWithMarkdownStrip(json)).toEqual(JSON.parse(json));
  });

  it("strips ```json fences and parses the inner JSON", () => {
    const inner = { file_id: "abc", condition: {} };
    const wrapped = "```json\n" + JSON.stringify(inner) + "\n```";
    expect(parseJsonWithMarkdownStrip(wrapped)).toEqual(inner);
  });

  it("strips plain ``` fences and parses the inner JSON", () => {
    const inner = { file_id: "xyz" };
    const wrapped = "```\n" + JSON.stringify(inner) + "\n```";
    expect(parseJsonWithMarkdownStrip(wrapped)).toEqual(inner);
  });

  it("strips fences with a generic language tag and parses the inner JSON", () => {
    const inner = { cloth_type: "T-Shirt" };
    const wrapped = "```typescript\n" + JSON.stringify(inner) + "\n```";
    expect(parseJsonWithMarkdownStrip(wrapped)).toEqual(inner);
  });

  it("returns raw string and logs error when plain JSON is invalid", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const raw = "not valid json at all";
    const result = parseJsonWithMarkdownStrip(raw);
    expect(result).toBe(raw);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("returns raw string and logs error when fenced content is invalid JSON", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const wrapped = "```json\nnot json\n```";
    const result = parseJsonWithMarkdownStrip(wrapped);
    expect(result).toBe(wrapped);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("handles fences without trailing newline before closing ```", () => {
    const inner = { ok: true };
    const wrapped = "```json\n" + JSON.stringify(inner) + "```";
    expect(parseJsonWithMarkdownStrip(wrapped)).toEqual(inner);
  });

  it("parses a cloth condition response wrapped in fences (integration)", () => {
    const clothCondition = {
      file_id: "file-001",
      condition: {
        cloth_details: {
          image: "base64...",
          cloth_type: "Jacket",
          cloth_fabric: "Denim",
          is_dirty_or_damaged: false,
          suitable_for_redesign: true,
          suitable_for_upcycling: true,
        },
      },
    };
    const wrapped = "```json\n" + JSON.stringify(clothCondition) + "\n```";
    expect(parseJsonWithMarkdownStrip(wrapped)).toEqual(clothCondition);
  });
});
