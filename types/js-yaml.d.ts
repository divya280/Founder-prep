// Minimal ambient declaration for js-yaml (no @types/js-yaml installed).
// We only use `load` to parse a doc's YAML frontmatter block.
declare module "js-yaml" {
  export function load(input: string): unknown;
}
