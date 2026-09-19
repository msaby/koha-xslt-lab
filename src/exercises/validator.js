function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function validateResult(html, rules) {
  const resultDocument = new DOMParser().parseFromString(html, "text/html");
  const text = normalizeText(resultDocument.body.textContent || "");
  return rules.map((rule) => {
    if (rule.type === "textEquals") {
      return { passed: text === normalizeText(rule.value), rule };
    }
    if (rule.type === "textContains") {
      const passed = text.includes(normalizeText(rule.value));
      return { passed, rule };
    }
    return { passed: false, rule, error: `Règle inconnue : ${rule.type}` };
  });
}
