import { describe, expect, test } from "vitest";
import { isAlphabetic, is_bad_regex } from "./isAlphabetic";

describe("isAlphabetic", () => {
  test("returns true for only lowercase letters", () => {
    expect(isAlphabetic("aaa")).toBe(true);
    expect(isAlphabetic("hey")).toBe(true);
    expect(isAlphabetic("testing")).toBe(true);
  });

  test("returns true for only uppercase letters", () => {
    expect(isAlphabetic("HELLO")).toBe(true);
    expect(isAlphabetic("ABC")).toBe(true);
  });

  test("returns true for mixed case letters", () => {
    expect(isAlphabetic("Hello")).toBe(true);
    expect(isAlphabetic("aBcDe")).toBe(true);
  });

  test("returns false for non-alphabetic characters", () => {
    expect(isAlphabetic("!")).toBe(false);
    expect(isAlphabetic("hey*")).toBe(false);
    expect(isAlphabetic("test123")).toBe(false);
    expect(isAlphabetic("hello world")).toBe(false);
    expect(isAlphabetic("")).toBe(false);
  });

  test("returns false for non-ASCII alphabetic characters", () => {
    expect(isAlphabetic("café")).toBe(false);
    expect(isAlphabetic("naïve")).toBe(false);
  });
});

describe("is_bad_regex", () => {
  test("returns true for strings longer than 4", () => {
    expect(is_bad_regex(["hello"])).toBe(true);
    expect(is_bad_regex(["worlds"])).toBe(true);
  });

  test("returns true for non-alphabetic entries", () => {
    expect(is_bad_regex(["toomanychars"])).toBe(true);
    expect(is_bad_regex(["not(just/text)"])).toBe(true);
    expect(is_bad_regex(["[[/d!!!"])).toBe(true);
    expect(is_bad_regex(["1234"])).toBe(true);
    expect(is_bad_regex(["ecs!"])).toBe(true);
    expect(is_bad_regex(["💥"])).toBe(true);
  });

  test("returns false for short alphabetic strings", () => {
    expect(is_bad_regex(["ECS"])).toBe(false);
    expect(is_bad_regex(["mat"])).toBe(false);
    expect(is_bad_regex(["abc"])).toBe(false);
    expect(is_bad_regex(["DEF"])).toBe(false);
  });

  test("handles multiple elements correctly", () => {
    expect(is_bad_regex(["ECS", "mat"])).toBe(false);
    expect(is_bad_regex(["ECS", "bad(string)"])).toBe(true);
    expect(is_bad_regex(["ok", "toolongname"])).toBe(true);
  });

  test("empty array returns false (no bad entries)", () => {
    expect(is_bad_regex([])).toBe(false);
  });
});
