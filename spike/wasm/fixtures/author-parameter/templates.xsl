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

