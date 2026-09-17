<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <xsl:output method="html" encoding="UTF-8"/>
  <!-- Parcourir chaque 200$e ; aucun séparateur si le sous-titre est absent. -->
  <xsl:template match="/">
    <xsl:for-each select="//marc:record">
      <p>
        <xsl:value-of select="marc:datafield[@tag='200']/marc:subfield[@code='a']"/>
        <xsl:for-each select="marc:datafield[@tag='200']/marc:subfield[@code='e']">
          <xsl:text> : </xsl:text>
          <xsl:value-of select="."/>
        </xsl:for-each>
      </p>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>
