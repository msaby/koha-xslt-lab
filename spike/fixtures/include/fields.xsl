<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:marc="http://www.loc.gov/MARC21/slim">
  <xsl:template name="author"><xsl:value-of select="/marc:record/marc:datafield[@tag='200']/marc:subfield[@code='f']"/></xsl:template>
</xsl:stylesheet>