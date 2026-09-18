Imported named templates lose xsl:with-param values in the Wasm engine. Sharing the caller's libxml2 dictionary in docLoader fixes the reproduction and the Koha stylesheets tested below.

## Tested version and execution path

- xslt-polyfill 1.0.28, commit `75d5220d1f3473f1fb79b036b839c344c465b703`.
- Chromium 153.0.8010.12, launched with `--disable-blink-features=XSLT`.
- We use the bundled `createXSLTTransformModule` factory directly, calling the C `transform` entrypoint through `cwrap(..., { async: true })`, with an absolute stylesheet URL. This report concerns that Wasm execution path, not the automatic XML-page replacement or public synchronous DOM wrapper.
- Files served over local HTTP. Reproduced both at the server root and under a repository subpath.

## Reproduction

The following files are the actual diagnostic fixtures. Apply `main.xsl` to `notice.xml`; keep `templates.xsl` alongside `main.xsl` so its import resolves.
The main sheet compares a direct selection with local and imported named templates, passing the parameter as a result tree fragment, string, and number.

### notice.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Notice minimale : un auteur principal et un coauteur témoin. -->
<record xmlns="http://www.loc.gov/MARC21/slim">
  <controlfield tag="001">TEST-AUTEUR</controlfield>
  <datafield tag="700" ind1=" " ind2="1">
    <subfield code="a">Brume</subfield>
    <subfield code="b">Lila</subfield>
  </datafield>
  <datafield tag="701" ind1=" " ind2="1">
    <subfield code="a">Rivage</subfield>
    <subfield code="b">Noé</subfield>
  </datafield>
</record>
```

### main.xsl

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <!-- Compare contexte, paramètre fragment de résultat (forme Koha), chaîne et nombre. -->
  <xsl:import href="templates.xsl"/>
  <xsl:output method="xml" omit-xml-declaration="yes" indent="no"/>
  <xsl:template match="/">
    <diagnostic><xsl:apply-templates select="marc:record"/></diagnostic>
  </xsl:template>
  <xsl:template match="marc:record">
    <direct fields="{count(marc:datafield)}" selected="{count(marc:datafield[@tag='700'])}"><xsl:value-of select="marc:datafield[@tag='700']/marc:subfield[@code='a']"/></direct>
      <case id="local-fragment"><xsl:call-template name="local"><xsl:with-param name="tag">700</xsl:with-param></xsl:call-template></case>
      <case id="local-string"><xsl:call-template name="local"><xsl:with-param name="tag" select="'700'"/></xsl:call-template></case>
      <case id="local-number"><xsl:call-template name="local"><xsl:with-param name="tag" select="700"/></xsl:call-template></case>
      <case id="imported-fragment"><xsl:call-template name="imported"><xsl:with-param name="tag">700</xsl:with-param></xsl:call-template></case>
      <case id="imported-string"><xsl:call-template name="imported"><xsl:with-param name="tag" select="'700'"/></xsl:call-template></case>
      <case id="imported-number"><xsl:call-template name="imported"><xsl:with-param name="tag" select="700"/></xsl:call-template></case>
  </xsl:template>
  <xsl:template name="local">
    <xsl:param name="tag"/>
    <probe context="{local-name()}" namespace="{namespace-uri()}" parameter="{string($tag)}" fields="{count(marc:datafield)}" selected="{count(marc:datafield[@tag=$tag])}">
      <xsl:for-each select="marc:datafield[@tag=$tag]"><author><xsl:value-of select="marc:subfield[@code='a']"/></author></xsl:for-each>
    </probe>
  </xsl:template>
</xsl:stylesheet>
```

### templates.xsl

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <!-- Même template que le témoin local ; seule son origine importée change. -->
  <xsl:template name="imported">
    <xsl:param name="tag"/>
    <probe context="{local-name()}" namespace="{namespace-uri()}" parameter="{string($tag)}" fields="{count(marc:datafield)}" selected="{count(marc:datafield[@tag=$tag])}">
      <xsl:for-each select="marc:datafield[@tag=$tag]"><author><xsl:value-of select="marc:subfield[@code='a']"/></author></xsl:for-each>
    </probe>
  </xsl:template>
</xsl:stylesheet>
```

## Expected and observed

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
