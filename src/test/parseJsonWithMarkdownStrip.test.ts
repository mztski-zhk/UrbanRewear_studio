import { describe, it, expect, vi, afterEach } from "vitest";
import { parseJsonWithMarkdownStrip, getClothDetails, type ClothCondition } from "@/services/api";

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

describe("getClothDetails()", () => {
  it("returns null for null input", () => {
    expect(getClothDetails(null)).toBeNull();
  });

  it("returns cloth_details when condition is an object", () => {
    const result: ClothCondition = {
      file_id: "file-001",
      condition: {
        cloth_details: {
          cloth_type: "T-shirt",
          cloth_fabric: "Cotton",
          is_dirty_or_damaged: false,
          suitable_for_redesign: true,
          suitable_for_upcycling: false,
        },
      },
    };
    expect(getClothDetails(result)).toEqual(result.condition.cloth_details);
  });

  it("returns null when condition is a raw string", () => {
    const result: ClothCondition = {
      file_id: "file-002",
      condition: "This cloth appears to be a cotton T-shirt in good condition.",
    };
    expect(getClothDetails(result)).toBeNull();
  });

  it("raw string condition is accessible directly on the result", () => {
    const rawCondition = "Worn denim jacket with minor fraying on the cuffs.";
    const result: ClothCondition = {
      condition: rawCondition,
    };
    expect(typeof result.condition).toBe("string");
    expect(result.condition).toBe(rawCondition);
  });
});
