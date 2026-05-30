// Content-based syntax detection.
//
// An untitled buffer should switch syntax when you paste/type recognizable code
// — but it must NOT misfire on prose or guess wildly on short snippets. So this
// is a deterministic signature scorer (not a statistical classifier): each
// language contributes points only for strong, characteristic patterns, and we
// require a minimum score before committing to anything but plain text.

const MIN_LENGTH = 8;
const MIN_SCORE = 3;

function firstLineOf(text: string): string {
  const nl = text.indexOf("\n");
  return nl === -1 ? text : text.slice(0, nl);
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/** Best-effort language id for some content. Returns "plaintext" when unsure. */
export function detectLanguage(content: string): string {
  const text = content.trim();
  if (text.length < MIN_LENGTH) return "plaintext";
  const first = firstLineOf(text);

  // --- High-confidence shortcuts ---
  if (first.startsWith("#!")) {
    if (/\b(ba|z|k)?sh\b/.test(first)) return "bash";
    if (/python/.test(first)) return "python";
    if (/\bnode\b/.test(first)) return "js";
    if (/ruby/.test(first)) return "ruby";
    if (/perl/.test(first)) return "perl";
  }
  if (/^<\?xml/i.test(text)) return "html";
  if (
    /<!doctype html/i.test(text) ||
    /<(html|head|body|div|span|p|a|ul|ol|li|table|script|style|h[1-6])\b[^>]*>/i.test(
      text,
    )
  )
    return "html";
  if ((text[0] === "{" || text[0] === "[") && isJson(text)) return "json";

  // --- Signature scoring ---
  const score: Record<string, number> = {};
  const add = (idLang: string, n: number) => {
    score[idLang] = (score[idLang] ?? 0) + n;
  };

  // JavaScript / TypeScript (TS signals collected separately to disambiguate)
  if (/\b(const|let|var)\s+\w+\s*=/.test(text)) add("js", 2);
  if (/\bfunction\s+\w*\s*\(/.test(text)) add("js", 2);
  if (/\)\s*=>|=>\s*[{(]/.test(text)) add("js", 1);
  if (/\bconsole\.(log|error|warn|info)\s*\(/.test(text)) add("js", 2);
  if (/\b(import|export)\b[^\n]*\bfrom\b/.test(text)) add("js", 1);
  if (/\b(async|await)\b/.test(text)) add("js", 1);
  let ts = 0;
  if (/:\s*(string|number|boolean|any|void|unknown|never)\b/.test(text)) ts += 3;
  if (/\binterface\s+\w+/.test(text)) ts += 3;
  if (/\btype\s+\w+\s*=/.test(text)) ts += 2;
  if (/\benum\s+\w+/.test(text)) ts += 2;
  if (/Promise<|Array<|Record<|ReadonlyArray</.test(text)) ts += 1;
  if (/\)\s*:\s*\w+/.test(text)) ts += 1;

  // Python
  if (/^\s*def\s+\w+\s*\(/m.test(text)) add("python", 3);
  if (/^\s*class\s+\w+\s*[:(]/m.test(text)) add("python", 2);
  if (/^\s*(from\s+[\w.]+\s+)?import\s+\w+/m.test(text)) add("python", 2);
  if (/\bprint\(/.test(text)) add("python", 1);
  if (/^\s*(elif|else|for|while|if|with|try|except|def|class)\b[^\n]*:\s*$/m.test(text))
    add("python", 2);
  if (/\bself\b/.test(text)) add("python", 1);
  if (/\bf"|\bf'/.test(text)) add("python", 1);

  // Shell / Bash
  if (/^\s*(if|elif)\b[^\n]*;\s*then\b/m.test(text) || /^\s*fi\s*$/m.test(text))
    add("bash", 3);
  if (/^\s*for\b[^\n]*;\s*do\b/m.test(text) || /^\s*done\s*$/m.test(text))
    add("bash", 2);
  if (/^\s*echo\s+/m.test(text)) add("bash", 1);
  if (/\$\(.+\)/.test(text)) add("bash", 1);
  if (/\$\{\w+\}/.test(text)) add("bash", 1);
  if (/^\s*(export\s+)?\w+=[^=]/m.test(text)) add("bash", 1);

  // Go
  if (/^\s*package\s+\w+/m.test(text)) add("go", 3);
  if (/\bfunc\s+(\(\w+[^)]*\)\s*)?\w*\s*\(/.test(text)) add("go", 2);
  if (/\bfmt\.\w+\(/.test(text)) add("go", 2);
  if (/:=\s*/.test(text)) add("go", 1);

  // Rust
  if (/\bfn\s+\w+\s*\(/.test(text)) add("rust", 2);
  if (/\blet\s+mut\b/.test(text)) add("rust", 2);
  if (/\bprintln!\s*\(/.test(text)) add("rust", 3);
  if (/\b(impl|pub\s+fn)\b|\buse\s+\w+::/.test(text)) add("rust", 2);

  // SQL
  if (/\bselect\b[\s\S]*\bfrom\b/i.test(text)) add("sql", 3);
  if (
    /\b(insert\s+into|update\s+\w+\s+set|delete\s+from|create\s+table|alter\s+table)\b/i.test(
      text,
    )
  )
    add("sql", 3);

  // CSS
  if (/[.#]?[\w-]+\s*\{[^}]*:[^}]*;/.test(text)) add("css", 2);
  if (/@(media|import|keyframes|font-face)\b/.test(text)) add("css", 2);
  if (/\b(margin|padding|color|background|display|font-size|border|width|height)\s*:/.test(text))
    add("css", 1);

  // YAML
  if (/^---\s*$/m.test(text)) add("yaml", 2);
  if (/^\s*[\w-]+:\s*\S/m.test(text) && /^\s*-\s+\S/m.test(text)) add("yaml", 3);
  // Note: bound whitespace to [ \t] so it can't span lines (\s includes \n).
  const mappingLines = (text.match(/^[ \t]*[\w-]+:([ \t].*)?$/gm) ?? []).length;
  if (mappingLines >= 4) add("yaml", 3);
  else if (mappingLines >= 2) add("yaml", 1);

  // Markdown
  if (/^#{1,6}\s+\S/m.test(text)) add("markdown", 2);
  if (/^```/m.test(text)) add("markdown", 2);
  if (/\[[^\]]+\]\([^)]+\)/.test(text)) add("markdown", 1);
  if (/^\s*[-*+]\s+\S/m.test(text) || /^\s*\d+\.\s+\S/m.test(text))
    add("markdown", 1);

  // Ruby
  if (/\bputs\s+\S/.test(text)) add("ruby", 2);
  if (/\bdef\s+\w[\s\S]*?\bend\b/.test(text)) add("ruby", 2);
  if (/\bdo\s*\|[^|]*\|/.test(text)) add("ruby", 2);
  if (/\brequire\s+['"]/.test(text)) add("ruby", 1);

  // Java
  if (/\bpublic\s+(class|static|void)\b/.test(text)) add("java", 2);
  if (/\bSystem\.out\.print/.test(text)) add("java", 3);
  if (/\bimport\s+java\./.test(text)) add("java", 3);

  // C / C++
  if (/^#\s*include\b/m.test(text)) add("cpp", 2);
  if (/\bstd::\w+/.test(text)) add("cpp", 2);
  if (/\bint\s+main\s*\(/.test(text)) add("cpp", 2);

  // Disambiguate TypeScript from JavaScript.
  if (score.js && ts >= 3) {
    score.ts = score.js + ts;
    delete score.js;
  } else if (!score.js && ts >= 3) {
    score.ts = ts;
  }

  let bestId = "plaintext";
  let bestScore = 0;
  for (const [langId, s] of Object.entries(score)) {
    if (s > bestScore) {
      bestScore = s;
      bestId = langId;
    }
  }
  return bestScore >= MIN_SCORE ? bestId : "plaintext";
}
