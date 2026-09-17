"""Vérifications XSLT 1.0 avec lxml (complément aux tests navigateur)."""
import json
from pathlib import Path
import unittest

from lxml import etree

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "content/xslt/samples"
SAMPLES = ROOT / "content/samples"
NS = {"m": "http://www.loc.gov/MARC21/slim"}


def transform(name, document):
    return etree.XSLT(etree.parse(str(SHEETS / name)))(document)


class ExampleStylesheetsTest(unittest.TestCase):
    def test_identity_preserves_all_sample_documents(self):
        for filename in json.loads((SAMPLES / "index.json").read_text()):
            with self.subTest(filename=filename):
                source = etree.parse(str(SAMPLES / filename))
                result = transform("identite.xsl", source)
                self.assertEqual(
                    etree.tostring(source, method="c14n"),
                    etree.tostring(result, method="c14n"),
                )

    def test_identity_preserves_order_attributes_comments_and_whitespace(self):
        source = etree.ElementTree(etree.fromstring(b'''<record xmlns="http://www.loc.gov/MARC21/slim" custom="yes">
  <?test keep?>
  <datafield tag="200" ind1="1" ind2=" "><subfield code="e"> First </subfield><subfield code="a">Title</subfield><subfield code="e">Second</subfield></datafield>
  <!--keep--><controlfield tag="001">42</controlfield>
  <datafield tag="200" ind1=" " ind2=" "><subfield code="a"/></datafield>
</record>'''))
        result = transform("identite.xsl", source)
        self.assertEqual(etree.tostring(source, method="c14n"), etree.tostring(result, method="c14n"))

    def test_html_examples_on_each_notice(self):
        for filename in json.loads((SAMPLES / "index.json").read_text()):
            with self.subTest(filename=filename):
                source = etree.parse(str(SAMPLES / filename))
                title = source.xpath("string(/m:record/m:datafield[@tag='200']/m:subfield[@code='a'])", namespaces=NS)
                author = source.xpath("string(/m:record/m:datafield[@tag='200']/m:subfield[@code='f'])", namespaces=NS)
                result = transform("titre-auteur.xsl", source)
                self.assertEqual(result.xpath("string(//h2)"), title)
                self.assertEqual(result.xpath("string(//p)"), author)
                subtitles = source.xpath("/m:record/m:datafield[@tag='200']/m:subfield[@code='e']/text()", namespaces=NS)
                result = transform("titre-sous-titres.xsl", source)
                self.assertEqual(result.xpath("string(//p)"), " : ".join([title] + subtitles))
                result = transform("tous-les-champs.xsl", source)
                fields = source.xpath("/m:record/m:controlfield|/m:record/m:datafield", namespaces=NS)
                self.assertEqual([text[:3] for text in result.xpath("//dt/text()")], [field.get("tag") for field in fields])
                expected = source.xpath("/m:record/m:datafield/m:subfield/text()", namespaces=NS)
                actual = ["".join(li.itertext()).split(" ", 1)[1] for li in result.xpath("//li")]
                self.assertEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()
