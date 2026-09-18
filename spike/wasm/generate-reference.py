"""Generate offline comparison results using the host's independent libxslt."""
import json
from pathlib import Path
from lxml import etree

ROOT = Path(__file__).resolve().parents[2]
cases = []

def add(xml, xsl):
    parser = etree.XMLParser(no_network=True)
    sheet = etree.parse(str(ROOT / xsl), parser)
    engine = etree.XSLT(sheet, access_control=etree.XSLTAccessControl(
        read_file=True, read_network=False, write_file=False, write_network=False))
    output = engine(etree.parse(str(ROOT / xml), parser))
    method = sheet.find('{http://www.w3.org/1999/XSL/Transform}output')
    cases.append(dict(xml=xml, xsl=xsl, method=method.get('method', 'xml') if method is not None else 'xml', expected=str(output)))

samples = json.loads((ROOT / 'content/samples/index.json').read_text())
styles = json.loads((ROOT / 'content/xslt/samples/index.json').read_text())
for name in json.loads((ROOT / 'content/exercises/index.json').read_text())['exercises']:
    exercise = json.loads((ROOT / f'content/exercises/{name}.json').read_text(encoding='utf-8'))
    add(exercise['files']['xml'], exercise['solution'])
for sample in samples:
    for style in styles:
        add(f'content/samples/{sample}', f'content/xslt/samples/{style}')
for style in ['simple.xsl', 'include/main.xsl', 'import/main.xsl']:
    add('spike/fixtures/record.xml', f'spike/fixtures/{style}')
for style in ['import/main.xsl', 'exslt.xsl', 'text.xsl', 'inert-output.xsl']:
    add('spike/wasm/fixtures/identity.xml', f'spike/wasm/fixtures/{style}')
add('spike/wasm/fixtures/identity.xml', 'content/xslt/samples/identite.xsl')
koha = 'content/koha/26.05.03/'
add('spike/wasm/fixtures/author-parameter/notice.xml', 'spike/wasm/fixtures/author-parameter/main.xsl')
for style in json.loads((ROOT / koha / 'manifest.json').read_text())['entrypoints']:
    for sample in samples:
        add(f'content/samples/{sample}', koha + style)
data = dict(reference=dict(libxml=list(etree.LIBXML_VERSION), libxslt=list(etree.LIBXSLT_VERSION)), cases=cases)
(ROOT / 'spike/wasm/reference.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(cases)} reference transformations generated')
