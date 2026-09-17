<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:marc="http://www.loc.gov/MARC21/slim" exclude-result-prefixes="marc">
  <xsl:output method="html" encoding="UTF-8"/>
  <!-- Affiche en HTML le titre (200$a), suivi de tous les sous-titres (200$e)
       dans leur ordre d’origine, séparés par « : ». Si aucun sous-titre
       n’est présent, seul le titre apparaît, sans séparateur.
       Consulter le résultat dans « Aperçu ». -->
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
