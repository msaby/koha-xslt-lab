<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common" exclude-result-prefixes="str exsl">
  <xsl:output method="xml" omit-xml-declaration="yes"/>
  <xsl:template match="/">
    <xsl:variable name="fragment"><value>présent</value></xsl:variable>
    <result><encoded><xsl:value-of select="str:encode-uri('Été &amp; café', true())"/></encoded><tokens><xsl:value-of select="count(str:tokenize('a b c', ' '))"/></tokens><node-set><xsl:value-of select="exsl:node-set($fragment)/value"/></node-set></result>
  </xsl:template>
</xsl:stylesheet>
