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

