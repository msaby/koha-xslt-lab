<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <xsl:output method="html" encoding="UTF-8"/>
  <!-- Une fiche par notice : titre 200$a et mention de responsabilité 200$f. -->
  <xsl:template match="/">
    <xsl:for-each select="//marc:record">
      <article>
        <h2><xsl:value-of select="marc:datafield[@tag='200']/marc:subfield[@code='a']"/></h2>
        <p><xsl:value-of select="marc:datafield[@tag='200']/marc:subfield[@code='f']"/></p>
      </article>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>
