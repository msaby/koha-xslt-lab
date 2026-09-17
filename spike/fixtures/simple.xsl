<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <xsl:output method="html" encoding="UTF-8"/>
  <xsl:template match="/">
    <p><xsl:value-of select="marc:record/marc:datafield[@tag='200']/marc:subfield[@code='f']"/></p>
  </xsl:template>
</xsl:stylesheet>