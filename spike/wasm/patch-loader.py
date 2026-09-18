"""Apply only the shared dictionary correction to an experimental source copy."""
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text()
old = 'xmlDocPtr doc = xmlReadMemory(content, strlen(content), url, "UTF-8", XML_PARSE_HUGE);'
new = '''/* Respect the caller's dictionary when loading imported stylesheets. */
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
  }'''
assert source.count(old) == 1, 'Upstream loader changed; review patch'
Path(sys.argv[2]).write_text(source.replace(old, new))
