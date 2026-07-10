import { load } from "js-yaml";
import type { DocFrontmatter, MandatoryStatus } from "@/types/rag";

// Split a markdown file into its YAML frontmatter and body, then parse the
// frontmatter. We use js-yaml (not a hand-rolled parser) because the docs use
// folded scalars (`disclaimer: >`) and list syntax (`sources:`) that a naive
// line parser would mangle.

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

export interface ParsedDoc {
  frontmatter: DocFrontmatter;
  body: string;
}

function normalizeMandatory(value: unknown): MandatoryStatus | undefined {
  // YAML parses `true`/`false` as booleans and `conditional` as a string, so we
  // normalize all three to a single tri-state string.
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "false" || v === "conditional") {
      return v as MandatoryStatus;
    }
  }
  return undefined;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return String(value);
  return undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter((item): item is string => Boolean(item));
  return items.length > 0 ? items : undefined;
}

/**
 * Parse a doc's frontmatter + body. Falls back to the filename as title and the
 * whole file as body when there is no frontmatter block, so a plain `.txt` doc
 * still ingests.
 */
export function parseFrontmatter(
  raw: string,
  fallbackTitle: string,
): ParsedDoc {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(FRONTMATTER_RE);

  if (!match) {
    return {
      frontmatter: { title: fallbackTitle },
      body: normalized.trim(),
    };
  }

  const yamlBlock = match[1];
  const body = normalized.slice(match[0].length).trim();

  const parsed = load(yamlBlock);
  const data: Record<string, unknown> =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  const frontmatter: DocFrontmatter = {
    title: toStringOrUndefined(data.title) ?? fallbackTitle,
    category: toStringOrUndefined(data.category),
    mandatory: normalizeMandatory(data.mandatory),
    domain_specific: data.domain_specific === true,
    jurisdiction: toStringOrUndefined(data.jurisdiction),
    last_updated: toStringOrUndefined(data.last_updated),
    disclaimer: toStringOrUndefined(data.disclaimer),
    sources: toStringArray(data.sources),
  };

  return { frontmatter, body };
}
