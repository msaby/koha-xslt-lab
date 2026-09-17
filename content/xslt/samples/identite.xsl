<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" encoding="UTF-8" indent="no"/>
  <!-- Recopie la notice en XML : éléments, attributs, valeurs, commentaires
       et ordre des champs sont conservés. Cette feuille sert de base pour
       modifier ensuite seulement certaines parties de la notice.
       Consulter le XML dans l’onglet « XML ou HTML généré » du laboratoire.
       La sérialisation peut changer la forme des balises ou des espaces de noms. -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
