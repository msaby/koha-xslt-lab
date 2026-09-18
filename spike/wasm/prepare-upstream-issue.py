"""Prepare a self-contained upstream report from the tested fixtures."""
from pathlib import Path

root = Path(__file__).resolve().parent
body = '''Imported named templates lose xsl:with-param values in the Wasm engine. Sharing the caller's libxml2 dictionary in docLoader fixes the reproduction and the Koha stylesheets tested below.

## Tested version and execution path

- xslt-polyfill 1.0.28, commit `75d5220d1f3473f1fb79b036b839c344c465b703`.
- Chromium 153.0.8010.12, launched with `--disable-blink-features=XSLT`.
- We use the bundled `createXSLTTransformModule` factory directly, calling the C `transform` entrypoint through `cwrap(..., { async: true })`, with an absolute stylesheet URL. This report concerns that Wasm execution path, not the automatic XML-page replacement or public synchronous DOM wrapper.
- Files served over local HTTP. Reproduced both at the server root and under a repository subpath.

## Reproduction

The following files are the actual diagnostic fixtures. Apply `main.xsl` to `notice.xml`; keep `templates.xsl` alongside `main.xsl` so its import resolves.
The main sheet compares a direct selection with local and imported named templates, passing the parameter as a result tree fragment, string, and number.

'''
for filename, language in [('notice.xml', 'xml'), ('main.xsl', 'xml'), ('templates.xsl', 'xml')]:
    body += f'### {filename}\n\n```{language}\n' + (root / 'fixtures/author-parameter' / filename).read_text(encoding='utf-8').strip() + '\n```\n\n'
body += '''## Expected and observed

All six calls should report `parameter="700"`, `selected="1"`, and `<author>Brume</author>`.
The direct selection and the three local calls succeed. All three imported calls instead report `parameter=""`, `selected="0"`, and no author.
The imported template executes, still sees context `record`, the correct MARCXML namespace and `fields="2"`. Changing the parameter from a result tree fragment to a string or number does not fix it.

This also silently removes author sections from the official Koha 26.05.03 UNIMARC OPAC detail and staff detail stylesheets, which pass field numbers to named templates in an imported utility stylesheet.

## Proposed correction

`docLoader` accepts `xmlDictPtr dict` but currently ignores it and calls `xmlReadMemory` for each dependency. The standard libxslt loader reuses this dictionary.
We tested replacing only the parsing statement in `src/transform.c` with:

```c
/* Respect the caller's dictionary when loading imported stylesheets. */
xmlParserCtxtPtr parser = xmlNewParserCtxt();
xmlDocPtr doc = NULL;
if (parser != NULL) {
    if (dict != NULL) {
        xmlDictReference(dict);
        xmlDictFree(parser->dict);
        parser->dict = dict;
    }
    doc = xmlCtxtReadMemory(parser, content, strlen(content), url, "UTF-8",
                            XML_PARSE_HUGE);
    xmlFreeParserCtxt(parser);
}
```

The existing diagnostic and `free(content)` remain after this block. Parsing flags were kept unchanged to isolate the dictionary change. Respecting the loader's `options` argument could be reviewed separately.

## Controlled before/after test

We rebuilt both an unpatched control and a patched copy using identical libraries and compiler settings:

- libxml2 `c34742f3017f6d39f3e4ccae4f70172238160ef8`
- libxslt `923903c59d668af42e3144bc623c9190a0f65988`
- Emscripten 3.1.5 (Ubuntu package). Both builds included `stdlib.h` and explicitly linked `stringToNewUTF8` for compatibility with this compiler.

| Build | Checks passed at root | Checks passed under subpath |
| --- | --- | --- |
| Upstream distributed bundle | 35/42 | 35/42 |
| Unpatched rebuilt control | 35/42 | 35/42 |
| Rebuilt with dictionary correction | 42/42 | 42/42 |

The seven failing checks are this diagnostic transformation and the two Koha detail stylesheets applied to three synthetic notices. All seven pass after the correction, without editing the Koha stylesheets or expected outputs.
The suite also covers identity, import precedence/apply-imports, nested dependencies, selected EXSLT functions, text output, and error recovery. Output comparisons use a host libxslt reference through lxml; HTML comparisons normalize whitespace and attribute order, so this is not a byte-for-byte or exhaustive conformance claim. Only Chromium was tested.

Would you consider preserving the supplied dictionary in the dependency loader and adding a regression test for parameters passed to an imported named template?
'''
(root / 'upstream-issue.md').write_text(body, encoding='utf-8')
print('Prepared spike/wasm/upstream-issue.md')
