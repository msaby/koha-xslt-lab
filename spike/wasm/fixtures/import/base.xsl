<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:include href="nested/value.xsl"/>
  <xsl:template match="*" priority="100"><base><xsl:call-template name="nested"/></base></xsl:template>
</xsl:stylesheet>
