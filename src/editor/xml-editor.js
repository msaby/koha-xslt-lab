import { EditorState } from "@codemirror/state";
import { EditorView, drawSelection, dropCursor, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { xml, xmlLanguage } from "@codemirror/lang-xml";
import { highlightTree, tags } from "@lezer/highlight";

const xmlHighlighting = HighlightStyle.define([
  { tag: tags.tagName, class: "syntax-tag" },
  { tag: tags.attributeName, class: "syntax-attribute" },
  { tag: tags.attributeValue, class: "syntax-value" },
  { tag: tags.comment, class: "syntax-comment" },
  { tag: [tags.processingInstruction, tags.meta], class: "syntax-meta" },
  { tag: [tags.angleBracket, tags.punctuation], class: "syntax-punctuation" },
  { tag: tags.character, class: "syntax-entity" },
]);

// Highlight serialized output without parsing it as executable HTML or changing its text.
export function renderXmlOutput(element, source) {
  const document = element.ownerDocument;
  const fragment = document.createDocumentFragment();
  let position = 0;
  highlightTree(xmlLanguage.parser.parse(source), xmlHighlighting, (from, to, classes) => {
    if (from > position) fragment.append(document.createTextNode(source.slice(position, from)));
    const span = document.createElement("span");
    span.className = classes;
    span.textContent = source.slice(from, to);
    fragment.append(span);
    position = to;
  });
  if (position < source.length) fragment.append(document.createTextNode(source.slice(position)));
  element.replaceChildren(fragment);
}

// A small value-based interface keeps loading and validation independent of CodeMirror.
export function createXmlEditor(selector, label, onTransform) {
  const extensions = [
    lineNumbers(), highlightActiveLineGutter(), highlightSpecialChars(),
    history(), drawSelection(), dropCursor(),
    xml({ autoCloseTags: false }),
    indentOnInput(), indentUnit.of("  "), bracketMatching(),
    syntaxHighlighting(xmlHighlighting), EditorView.lineWrapping,
    EditorState.tabSize.of(2),
    EditorView.contentAttributes.of({
      "aria-label": label,
      "aria-multiline": "true",
      spellcheck: "false",
      autocorrect: "off",
      autocapitalize: "off",
    }),
    keymap.of([
      { key: "Mod-Enter", run: () => { onTransform(); return true; } },
      ...defaultKeymap, ...historyKeymap,
    ]),
  ];
  const view = new EditorView({
    parent: document.querySelector(selector),
    state: EditorState.create({ doc: "", extensions }),
  });
  return {
    get value() { return view.state.doc.toString(); },
    set value(text) {
      // A loaded file starts a fresh undo history; typing and pasting keep normal undo.
      view.setState(EditorState.create({ doc: text, extensions }));
    },
    focus() { view.focus(); },
  };
}
