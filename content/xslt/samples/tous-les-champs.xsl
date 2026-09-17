<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <xsl:output method="html" encoding="UTF-8"/>
  <!-- Transforme la notice en HTML lisible : le label, les zones, les indicateurs
       et les sous-zones sont présentés sous forme de listes, dans leur ordre
       d’origine. La structure XML n’est pas conservée.
       Consulter le résultat dans « Aperçu ». -->
  <xsl:template match="/">
    <xsl:for-each select="//marc:record">
      <article>
        <h2>Champs de la notice</h2>
        <dl><xsl:apply-templates select="marc:leader|marc:controlfield|marc:datafield"/></dl>
      </article>
    </xsl:for-each>
  </xsl:template>
  <xsl:template match="marc:leader">
    <dt>Label</dt><dd><xsl:value-of select="."/></dd>
  </xsl:template>
  <xsl:template match="marc:controlfield">
    <dt><xsl:value-of select="@tag"/></dt><dd><xsl:value-of select="."/></dd>
  </xsl:template>
  <xsl:template match="marc:datafield">
    <dt><xsl:value-of select="@tag"/><xsl:text> [</xsl:text><xsl:value-of select="@ind1"/><xsl:value-of select="@ind2"/><xsl:text>]</xsl:text></dt>
    <dd>
      <ul>
        <xsl:for-each select="marc:subfield">
          <li><strong><xsl:text>$</xsl:text><xsl:value-of select="@code"/></strong><xsl:text> </xsl:text><xsl:value-of select="."/></li>
        </xsl:for-each>
      </ul>
    </dd>
  </xsl:template>
</xsl:stylesheet>
