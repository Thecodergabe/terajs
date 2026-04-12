/**
 * @file stripTypes.ts
 * @description
 * Very small, dependency‑free TypeScript stripper for Terajs SFC `<script>` blocks.
 *
 * This is NOT a full TS parser. It focuses on:
 * - removing `: Type` annotations on variables, params, and properties
 * - removing `interface` and `type` declarations
 * - removing generic parameters on functions (`<T>`)
 *
 * The goal is to make the script valid JavaScript for further processing,
 * not to perfectly understand TypeScript semantics.
 */

/**
 * Strips a subset of TypeScript syntax from a script string.
 *
 * @param source - Raw script content (TS or JS).
 * @returns A JS‑compatible string with TS syntax removed.
 */
export function stripTypes(source: string): string {
  let code = source;

  // Remove interface declarations
  code = code.replace(/interface\s+\w+\s*{[^}]*}/gms, "");

  // Remove type aliases
  code = code.replace(/type\s+\w+\s*=\s*[^;]+;/gms, "");

  // Remove simple generic parameters on functions: function foo<T>(...
  code = code.replace(/function\s+(\w+)\s*<[^>]+>\s*\(/g, "function $1(");

  // Remove simple generic arrow functions: const foo = <T>(...
  code = code.replace(/=\s*<[^>]+>\s*\(/g, "= (");

  // Remove type annotations without corrupting normal object literal values.
  code = stripTypeAnnotations(code);

  return code;
}

type SignificantToken = {
  type: "word" | "punct";
  value: string;
  index: number;
};

type Scope =
  | {
      kind: "paren";
      openIndex: number;
      prevToken: SignificantToken | null;
      prevPrevToken: SignificantToken | null;
    }
  | {
      kind: "brace";
      subtype: "block" | "class" | "object";
      openIndex: number;
    }
  | {
      kind: "bracket";
      openIndex: number;
    };

type DeclarationState = {
  depth: number;
  awaitingType: boolean;
};

const CONTROL_FLOW_KEYWORDS = new Set(["catch", "for", "if", "switch", "while", "with"]);

function stripTypeAnnotations(source: string): string {
  let output = "";
  const scopes: Scope[] = [];
  const closedParens = new Map<number, Extract<Scope, { kind: "paren" }>>();
  let previousToken: SignificantToken | null = null;
  let lastToken: SignificantToken | null = null;
  let declaration: DeclarationState | null = null;
  let pendingClassBrace = false;

  for (let index = 0; index < source.length;) {
    const char = source[index];

    if (startsLineComment(source, index)) {
      const end = skipLineComment(source, index);
      output += source.slice(index, end);
      index = end;
      continue;
    }

    if (startsBlockComment(source, index)) {
      const end = skipBlockComment(source, index);
      output += source.slice(index, end);
      index = end;
      continue;
    }

    if (isQuote(char)) {
      const end = skipQuotedLiteral(source, index);
      output += source.slice(index, end);
      index = end;
      continue;
    }

    if (isWhitespace(char)) {
      output += char;
      index += 1;
      continue;
    }

    if (isIdentifierStart(char)) {
      const end = readIdentifier(source, index);
      const word = source.slice(index, end);
      output += word;

      if (word === "class") {
        pendingClassBrace = true;
      }

      if (word === "const" || word === "let" || word === "var") {
        declaration = {
          depth: scopes.length,
          awaitingType: true,
        };
      }

      previousToken = lastToken;
      lastToken = { type: "word", value: word, index };
      index = end;
      continue;
    }

    if (char === "(") {
      scopes.push({
        kind: "paren",
        openIndex: index,
        prevToken: lastToken,
        prevPrevToken: previousToken,
      });
      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === ")") {
      const scope = popScope(scopes, "paren");
      if (scope) {
        closedParens.set(index, scope);
      }

      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === "{") {
      scopes.push({
        kind: "brace",
        subtype: classifyBraceScope(lastToken, pendingClassBrace),
        openIndex: index,
      });
      pendingClassBrace = false;
      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === "}") {
      popScope(scopes, "brace");
      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === "[") {
      scopes.push({ kind: "bracket", openIndex: index });
      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === "]") {
      popScope(scopes, "bracket");
      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === ":") {
      if (shouldStripTypeAnnotation(source, index, scopes, closedParens, declaration, lastToken)) {
        const result = findTypeAnnotationEnd(source, index + 1);
        if (result.preserveSpace && output.length > 0 && !isWhitespace(output[output.length - 1])) {
          output += " ";
        }
        index = result.endIndex;
        continue;
      }

      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === ",") {
      if (declaration && scopes.length === declaration.depth) {
        declaration.awaitingType = true;
      }

      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === ";") {
      if (declaration && scopes.length === declaration.depth) {
        declaration = null;
      }

      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === "=" && source[index + 1] !== "=" && source[index + 1] !== ">") {
      if (declaration && scopes.length === declaration.depth) {
        declaration.awaitingType = false;
      }

      output += char;
      previousToken = lastToken;
      lastToken = { type: "punct", value: char, index };
      index += 1;
      continue;
    }

    if (char === "=" && source[index + 1] === ">") {
      output += "=>";
      previousToken = lastToken;
      lastToken = { type: "punct", value: "=>", index };
      index += 2;
      continue;
    }

    output += char;
    previousToken = lastToken;
    lastToken = { type: "punct", value: char, index };
    index += 1;
  }

  return output;
}

function shouldStripTypeAnnotation(
  source: string,
  index: number,
  scopes: Scope[],
  closedParens: Map<number, Extract<Scope, { kind: "paren" }>>,
  declaration: DeclarationState | null,
  token: SignificantToken | null,
): boolean {
  if (!token) {
    return false;
  }

  if (token.value === "?") {
    return looksLikeOptionalTypeAnnotation(source, scopes);
  }

  if (!isBindingToken(token)) {
    return false;
  }

  const openParen = getNearestParenScope(scopes);
  if (openParen && looksLikeParameterList(source, openParen)) {
    return true;
  }

  if (token.value === ")") {
    const closed = closedParens.get(token.index);
    if (closed && looksLikeParameterList(source, closed)) {
      return true;
    }
  }

  if (declaration && declaration.awaitingType && scopes.length === declaration.depth) {
    return true;
  }

  const nearestBrace = getNearestBraceScope(scopes);
  if (nearestBrace?.subtype === "class") {
    return true;
  }

  if (nearestBrace?.subtype === "object") {
    return false;
  }

  return false;
}

function looksLikeOptionalTypeAnnotation(
  source: string,
  scopes: Scope[],
): boolean {
  const openParen = getNearestParenScope(scopes);
  if (openParen && looksLikeParameterList(source, openParen)) {
    return true;
  }

  const nearestBrace = getNearestBraceScope(scopes);
  if (nearestBrace?.subtype === "class") {
    return true;
  }

  if (nearestBrace?.subtype === "object") {
    return false;
  }

  return false;
}

function looksLikeParameterList(source: string, scope: Extract<Scope, { kind: "paren" }>): boolean {
  const closeIndex = findMatchingParen(source, scope.openIndex);
  if (closeIndex === -1) {
    return false;
  }

  const nextToken = readNextSignificantToken(source, closeIndex + 1);
  const prevToken = scope.prevToken;
  const prevPrevToken = scope.prevPrevToken;

  if (!nextToken) {
    return false;
  }

  if (nextToken.value === "=>") {
    return true;
  }

  if (prevToken?.value === "function") {
    return true;
  }

  if (prevToken?.type === "word" && prevPrevToken?.value === "function") {
    return true;
  }

  if (nextToken.value === ":" && prevToken?.type === "word" && isMethodDeclarationLead(prevPrevToken)) {
    return true;
  }

  if (nextToken.value === "{" && prevToken?.type === "word" && !CONTROL_FLOW_KEYWORDS.has(prevToken.value)) {
    return true;
  }

  return false;
}

function findTypeAnnotationEnd(source: string, start: number): {
  endIndex: number;
  preserveSpace: boolean;
  isTypedPosition: boolean;
} {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let sawContent = false;

  for (let index = start; index < source.length;) {
    const char = source[index];

    if (startsLineComment(source, index)) {
      index = skipLineComment(source, index);
      continue;
    }

    if (startsBlockComment(source, index)) {
      index = skipBlockComment(source, index);
      continue;
    }

    if (isQuote(char)) {
      sawContent = true;
      index = skipQuotedLiteral(source, index);
      continue;
    }

    if (isWhitespace(char)) {
      index += 1;
      continue;
    }

    if (char === "(") {
      sawContent = true;
      parenDepth += 1;
      index += 1;
      continue;
    }

    if (char === ")") {
      if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0 && angleDepth === 0) {
        return {
          endIndex: index,
          preserveSpace: false,
          isTypedPosition: sawContent,
        };
      }

      sawContent = true;
      parenDepth = Math.max(0, parenDepth - 1);
      index += 1;
      continue;
    }

    if (char === "[") {
      sawContent = true;
      bracketDepth += 1;
      index += 1;
      continue;
    }

    if (char === "]") {
      sawContent = true;
      bracketDepth = Math.max(0, bracketDepth - 1);
      index += 1;
      continue;
    }

    if (char === "{") {
      if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0 && angleDepth === 0) {
        return {
          endIndex: index,
          preserveSpace: hasTrailingSpace(source, start, index),
          isTypedPosition: sawContent,
        };
      }

      sawContent = true;
      braceDepth += 1;
      index += 1;
      continue;
    }

    if (char === "}") {
      if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0 && angleDepth === 0) {
        return {
          endIndex: index,
          preserveSpace: false,
          isTypedPosition: sawContent,
        };
      }

      sawContent = true;
      braceDepth = Math.max(0, braceDepth - 1);
      index += 1;
      continue;
    }

    if (char === "<") {
      sawContent = true;
      angleDepth += 1;
      index += 1;
      continue;
    }

    if (char === ">") {
      sawContent = true;
      angleDepth = Math.max(0, angleDepth - 1);
      index += 1;
      continue;
    }

    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0 && angleDepth === 0) {
      if (char === "," || char === ";") {
        return {
          endIndex: index,
          preserveSpace: false,
          isTypedPosition: sawContent,
        };
      }

      if (char === "=" && source[index + 1] !== "=" && source[index + 1] !== ">") {
        return {
          endIndex: index,
          preserveSpace: hasTrailingSpace(source, start, index),
          isTypedPosition: sawContent,
        };
      }
    }

    sawContent = true;
    index += 1;
  }

  return {
    endIndex: source.length,
    preserveSpace: false,
    isTypedPosition: sawContent,
  };
}

function classifyBraceScope(token: SignificantToken | null, pendingClassBrace: boolean): "block" | "class" | "object" {
  if (pendingClassBrace) {
    return "class";
  }

  if (!token) {
    return "object";
  }

  if (token.type === "word") {
    return token.value === "return" ? "object" : "block";
  }

  if (token.value === "=" || token.value === "(" || token.value === "[" || token.value === "{" || token.value === "," || token.value === ":" || token.value === "?") {
    return "object";
  }

  return "block";
}

function getNearestParenScope(scopes: Scope[]): Extract<Scope, { kind: "paren" }> | null {
  for (let index = scopes.length - 1; index >= 0; index -= 1) {
    const scope = scopes[index];
    if (scope.kind === "paren") {
      return scope;
    }
  }

  return null;
}

function getNearestBraceScope(scopes: Scope[]): Extract<Scope, { kind: "brace" }> | null {
  for (let index = scopes.length - 1; index >= 0; index -= 1) {
    const scope = scopes[index];
    if (scope.kind === "brace") {
      return scope;
    }
  }

  return null;
}

function popScope<K extends Scope["kind"]>(scopes: Scope[], kind: K): Extract<Scope, { kind: K }> | null {
  for (let index = scopes.length - 1; index >= 0; index -= 1) {
    const scope = scopes[index];
    if (scope.kind === kind) {
      scopes.splice(index, 1);
      return scope as Extract<Scope, { kind: K }>;
    }
  }

  return null;
}

function findMatchingParen(source: string, openIndex: number): number {
  let depth = 0;

  for (let index = openIndex; index < source.length;) {
    const char = source[index];

    if (startsLineComment(source, index)) {
      index = skipLineComment(source, index);
      continue;
    }

    if (startsBlockComment(source, index)) {
      index = skipBlockComment(source, index);
      continue;
    }

    if (isQuote(char)) {
      index = skipQuotedLiteral(source, index);
      continue;
    }

    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  return -1;
}

function readNextSignificantToken(source: string, start: number): SignificantToken | null {
  for (let index = start; index < source.length;) {
    if (startsLineComment(source, index)) {
      index = skipLineComment(source, index);
      continue;
    }

    if (startsBlockComment(source, index)) {
      index = skipBlockComment(source, index);
      continue;
    }

    const char = source[index];
    if (isWhitespace(char)) {
      index += 1;
      continue;
    }

    if (isIdentifierStart(char)) {
      const end = readIdentifier(source, index);
      return {
        type: "word",
        value: source.slice(index, end),
        index,
      };
    }

    if (char === "=" && source[index + 1] === ">") {
      return {
        type: "punct",
        value: "=>",
        index,
      };
    }

    return {
      type: "punct",
      value: char,
      index,
    };
  }

  return null;
}

function isBindingToken(token: SignificantToken): boolean {
  if (token.type === "word") {
    return true;
  }

  return token.value === ")" || token.value === "]" || token.value === "}";
}

function hasTrailingSpace(source: string, start: number, end: number): boolean {
  for (let index = end - 1; index >= start; index -= 1) {
    if (isWhitespace(source[index])) {
      return true;
    }

    return false;
  }

  return false;
}

function isMethodDeclarationLead(token: SignificantToken | null): boolean {
  if (!token) {
    return true;
  }

  if (token.type === "word") {
    return token.value === "async";
  }

  return token.value === "{" || token.value === "," || token.value === ";" || token.value === "*";
}

function isWhitespace(char: string): boolean {
  return char === " " || char === "\n" || char === "\r" || char === "\t";
}

function isQuote(char: string): boolean {
  return char === '"' || char === "'" || char === "`";
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

function readIdentifier(source: string, start: number): number {
  let index = start + 1;

  while (index < source.length && /[A-Za-z0-9_$]/.test(source[index])) {
    index += 1;
  }

  return index;
}

function startsLineComment(source: string, index: number): boolean {
  return source[index] === "/" && source[index + 1] === "/";
}

function startsBlockComment(source: string, index: number): boolean {
  return source[index] === "/" && source[index + 1] === "*";
}

function skipLineComment(source: string, start: number): number {
  let index = start + 2;
  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }

  return index;
}

function skipBlockComment(source: string, start: number): number {
  const end = source.indexOf("*/", start + 2);
  return end === -1 ? source.length : end + 2;
}

function skipQuotedLiteral(source: string, start: number): number {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      index += 2;
      continue;
    }

    if (char === quote) {
      return index + 1;
    }

    index += 1;
  }

  return source.length;
}
