<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <xsl:output method="html" encoding="UTF-8"/>
  <!-- Transforme chaque notice en une fiche HTML simple avec le titre (200$a)
       et la mention de responsabilité (200$f, généralement l’auteur).
       Les autres champs ne sont pas affichés. Consulter le résultat dans « Aperçu ». -->
  <xsl:template match="/">
    <xsl:for-each select="//marc:record">
      <article>
        <h2><xsl:value-of select="marc:datafield[@tag='200']/marc:subfield[@code='a']"/></h2>
        <p><xsl:value-of select="marc:datafield[@tag='200']/marc:subfield[@code='f']"/></p>
      </article>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>
