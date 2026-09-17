<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" encoding="UTF-8" indent="no"/>
  <!-- Transformation identité : recopier les nœuds et attributs sans les modifier.
       Consulter le XML dans l’onglet « HTML généré » du laboratoire.
       La sérialisation peut changer la forme des balises ou des espaces de noms. -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
