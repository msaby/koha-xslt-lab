// Format the displayed source only. Keep mixed text and whitespace-sensitive
// elements verbatim; never reserialize through an HTML parser.
export function formatOutput(source) {
  const tokens = source.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE(?:[^>"'\[]|"[^"]*"|'[^']*'|\[[\s\S]*?\])*>|<\/?[A-Za-z_][\w:.-]*(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/gi);
  if (!tokens || tokens.join('') !== source) return source;
  const root = { children: [] };
  const stack = [root];
  const html = !/^\s*<\?xml\b/i.test(source) && /<(?:html|div|span|h[1-6]|p|article)\b/i.test(source);
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const token of tokens) {
    const name = /^<([A-Za-z_][\w:.-]*)/.exec(token)?.[1];
    if (token.startsWith('</')) {
      if (stack.length === 1 || token.slice(2, -1).trim() !== stack.at(-1).name) return source;
      stack.pop().close = token;
    } else if (name && !/\/\s*>$/.test(token) && !(html && voidTags.has(name.toLowerCase()))) {
      const node = { name, open: token, children: [] };
      stack.at(-1).children.push(node);
      stack.push(node);
    } else stack.at(-1).children.push(token);
  }
  if (stack.length !== 1) return source;
  const raw = node => typeof node === 'string' ? node : (node.open || '') + node.children.map(raw).join('') + (node.close || '');
  function format(node, depth) {
    if (typeof node === 'string') return node;
    if (/^(?:pre|textarea|script|style)$/i.test(node.name || '') || /\bxml:space\s*=\s*(["'])preserve\1/.test(node.open || '') ||
        (node.open && node.children.some(child => typeof child === 'string' && ((!child.startsWith('<') && child.trim()) || child.startsWith('<![CDATA['))))) return raw(node);
    // A fragment can contain both top-level text and elements (Koha result
    // lists). Format its element subtrees instead of returning the whole
    // fragment verbatim. Plain text output still stays untouched.
    if (!node.open && node.children.every(child => typeof child === 'string' && !child.startsWith('<'))) return source;
    const children = node.children.filter(child => typeof child !== 'string' || child.trim());
    if (!children.length) return node.open ? raw(node) : source;
    const indent = '  '.repeat(depth);
    const content = children.map(child => '  '.repeat(node.open ? depth + 1 : depth) + format(child, node.open ? depth + 1 : depth)).join('\n');
    return node.open ? `${node.open}\n${content}\n${indent}${node.close}` : content;
  }
  try { return format(root, 0); } catch { return source; }
}

