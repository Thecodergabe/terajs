/**
 * @file compileScript.ts
 * @description
 * Terajs SFC script compiler (dependency‑free).
 *
 * Responsibilities:
 * - Strip a subset of TypeScript syntax
 * - Tokenize the script
 * - Scan for top‑level declarations
 * - Wrap the script in a `setup(ctx)` function
 * - Inject `props`, `slots`, `emit`
 * - Return the setup function code and exposed identifiers
 */

import { stripTypes } from "./stripTypes.js";
import { tokenizeScript, type Token } from "./tokenizeScript.js";
import { scanTopLevel } from "./scanTopLevel.js";

export interface CompiledScript {
  /**
   * The generated setup function as JavaScript code.
   */
  setupCode: string;

  /**
   * Top‑level identifiers exposed to the template compiler.
   */
  exposed: string[];

  /**
   * Top-level imported bindings available to the compiled module.
   */
  importedBindings: string[];

  /**
   * Whether this script uses createResource and should be treated as async.
   */
  hasAsyncResource: boolean;
}

interface HoistedScript {
  imports: string[];
  body: string;
}

function extractImportedBindings(imports: string[]): string[] {
  const bindings = new Set<string>();

  for (const statement of imports) {
    const normalized = statement.replace(/\s+/g, " ").trim().replace(/;$/, "");

    if (/^import\s+["']/.test(normalized)) {
      continue;
    }

    const fromIndex = normalized.lastIndexOf(" from ");
    const clause = fromIndex === -1
      ? normalized.replace(/^import\s+/, "").trim()
      : normalized.slice("import ".length, fromIndex).trim();

    if (!clause) {
      continue;
    }

    const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespaceMatch) {
      bindings.add(namespaceMatch[1]);
    }

    const namedMatch = clause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      for (const entry of namedMatch[1].split(",")) {
        const trimmed = entry.trim();
        if (!trimmed) {
          continue;
        }

        const aliasMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
        if (aliasMatch) {
          bindings.add(aliasMatch[2]);
          continue;
        }

        bindings.add(trimmed);
      }
    }

    const defaultClause = clause
      .replace(/\{[^}]+\}/, "")
      .replace(/\*\s+as\s+[A-Za-z_$][\w$]*/, "")
      .replace(/,/g, " ")
      .trim();

    if (/^[A-Za-z_$][\w$]*$/.test(defaultClause)) {
      bindings.add(defaultClause);
    }
  }

  return [...bindings];
}

function isIdentifierChar(value: string | undefined): boolean {
  return Boolean(value && /[A-Za-z0-9_$]/.test(value));
}

function skipStringLiteral(source: string, start: number): number {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    const ch = source[index];

    if (ch === "\\") {
      index += 2;
      continue;
    }

    index += 1;
    if (ch === quote) {
      break;
    }
  }

  return index;
}

function skipLineComment(source: string, start: number): number {
  let index = start + 2;
  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }
  return index;
}

function skipBlockComment(source: string, start: number): number {
  let index = start + 2;
  while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
    index += 1;
  }

  if (index < source.length) {
    index += 2;
  }

  return index;
}

function isTopLevelImportDeclarationStart(source: string, index: number): boolean {
  if (source.slice(index, index + 6) !== "import") {
    return false;
  }

  if (isIdentifierChar(source[index - 1]) || isIdentifierChar(source[index + 6])) {
    return false;
  }

  let cursor = index + 6;
  while (cursor < source.length && /\s/.test(source[cursor])) {
    cursor += 1;
  }

  const next = source[cursor];
  if (next === "(" || next === ".") {
    return false;
  }

  return true;
}

function readImportDeclaration(source: string, start: number): { statement: string; end: number } | null {
  let cursor = start;
  let nesting = 0;
  let sawToken = false;

  while (cursor < source.length) {
    const ch = source[cursor];

    if (ch === '"' || ch === "'" || ch === "`") {
      cursor = skipStringLiteral(source, cursor);
      sawToken = true;
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "/") {
      cursor = skipLineComment(source, cursor);
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "*") {
      cursor = skipBlockComment(source, cursor);
      continue;
    }

    if (!/\s/.test(ch)) {
      sawToken = true;
    }

    if (ch === "{" || ch === "(" || ch === "[") {
      nesting += 1;
      cursor += 1;
      continue;
    }

    if (ch === "}" || ch === ")" || ch === "]") {
      nesting = Math.max(0, nesting - 1);
      cursor += 1;
      continue;
    }

    if (ch === ";" && nesting === 0) {
      cursor += 1;
      break;
    }

    if ((ch === "\n" || ch === "\r") && nesting === 0 && sawToken) {
      break;
    }

    cursor += 1;
  }

  let end = cursor;
  while (end < source.length && (source[end] === " " || source[end] === "\t")) {
    end += 1;
  }

  if (source[end] === "\r" && source[end + 1] === "\n") {
    end += 2;
  } else if (source[end] === "\n" || source[end] === "\r") {
    end += 1;
  }

  const statement = source.slice(start, cursor).trim();
  if (!statement.startsWith("import")) {
    return null;
  }

  return { statement, end };
}

function hoistTopLevelImports(source: string): HoistedScript {
  const imports: string[] = [];
  const segments: string[] = [];
  let depth = 0;
  let cursor = 0;
  let segmentStart = 0;

  while (cursor < source.length) {
    const ch = source[cursor];

    if (ch === '"' || ch === "'" || ch === "`") {
      cursor = skipStringLiteral(source, cursor);
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "/") {
      cursor = skipLineComment(source, cursor);
      continue;
    }

    if (ch === "/" && source[cursor + 1] === "*") {
      cursor = skipBlockComment(source, cursor);
      continue;
    }

    if (ch === "{") {
      depth += 1;
      cursor += 1;
      continue;
    }

    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      cursor += 1;
      continue;
    }

    if (depth === 0 && isTopLevelImportDeclarationStart(source, cursor)) {
      const declaration = readImportDeclaration(source, cursor);
      if (declaration) {
        segments.push(source.slice(segmentStart, cursor));
        imports.push(declaration.statement);
        cursor = declaration.end;
        segmentStart = cursor;
        continue;
      }
    }

    cursor += 1;
  }

  segments.push(source.slice(segmentStart));

  return {
    imports,
    body: segments.join("").trim()
  };
}

function hasCreateResourceCall(tokens: Token[]): boolean {
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (tokens[i].type === "identifier" && tokens[i].value === "createResource") {
      const next = tokens[i + 1];
      if (next && next.type === "punct" && next.value === "(") {
        return true;
      }
    }
  }
  return false;
}

/**
 * Compiles the raw `<script>` block into a setup function.
 *
 * @param script - Raw script content from the SFC.
 * @returns A compiled setup function and list of exposed identifiers.
 */
export function compileScript(script: string): CompiledScript {
  // 1. Strip TypeScript syntax
  const jsLike = stripTypes(script);

  // 1.5 Hoist top-level imports so setup() remains valid JavaScript.
  const { imports, body } = hoistTopLevelImports(jsLike);
  const importedBindings = extractImportedBindings(imports);

  // 2. Tokenize
  const tokens = tokenizeScript(jsLike);

  // 3. Scan top‑level declarations
  const { identifiers } = scanTopLevel(tokens);

  // 4. Detect async resource usage for streaming suspension.
  const hasAsyncResource = hasCreateResourceCall(tokens);

  // 5. Wrap in a renderer-local setup function
  const setupCode = `
${imports.join("\n")}
function __ssfc(ctx) {
  const { props, slots, emit } = ctx;
  ${body}
  return { ${identifiers.join(", ")} };
}
`.trim();

  return {
    setupCode,
    exposed: identifiers,
    importedBindings,
    hasAsyncResource
  };
}
