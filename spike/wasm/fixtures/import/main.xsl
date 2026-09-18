<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:import href="base.xsl"/>
  <xsl:output method="xml" omit-xml-declaration="yes"/>
  <xsl:template match="/"><result><xsl:apply-templates select="*"/></result></xsl:template>
  <xsl:template match="*" priority="-10"><override><xsl:apply-imports/></override></xsl:template>
</xsl:stylesheet>
