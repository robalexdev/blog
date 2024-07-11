<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" exclude-result-prefixes="atom">
  <xsl:output method="html" version="5.0" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="rss/channel/title" /></title>
        <meta charset="utf-8" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

<style>
header {
  background-color: orange;
  padding: 2em;
  text-align: center;

  }




body {
  margin: auto;
  max-width: 52em;
  font-size: 1.2em;
  font-family: system-ui, -apple-system, Helvetica;
  background-color: #eee;
  padding-bottom: 10em;
}

  header {
    margin-bottom: 3em;
  }

  main.post h1 {
    margin-bottom: 0;
  }

  figure {
    padding: 2em 0;
  }

  div.content {
    margin: 2em;
  }

  h2 {
    margin-top: 3em;
  }

  h2 {
    margin-top: 3em;
  }

  h3 {
    margin-top: 3em;
  }

  h3.post-listing {
    font-size: 0.7em;
  }

  h3 > a {
    font-size: 1.6em;
    font-style: normal;
  }

  a {
    color: #118;
  }

  a:visited {
    color: #717;
  }

  a.rss {
    background-color: #e83;
    padding: 0.4em 1em;
  }

  a.blogroll {
    background-color: #8be;
    padding: 0.4em 1em;
    margin-left: 1em;
  }

  span.sep:before {
    padding: 1.2em;
    content: '\2234';
  }

  div.cat-tags {
    font-size: 0.9em;
    margin: 1em 0em 1em 0em;
  }

  span.cat-tag {
    margin: 0 0.2em 0 0;
    padding: 0.4em 1em;
    background-color: #eee;
    border: 0.1em dashed #aaa;
    color: #222;
  }

  span.cat-tag.popular {
    background-color: #eae;
  }

code {
  padding: 0.5em;
  background-color: #ddd;
}
pre {
  background-color: #ddd;
  padding: 2em;
}
pre > code {
  padding: 0;
}


  </style>
      </head>
      <body>
        <header>
          This is an RSS feed (<a href="https://developer.mozilla.org/en-US/docs/Web/XSLT">styled with XSLT</a>).
          <br />
          You can paste this URL into your feed reader to subscribe.
        </header>
        <main>
          <h1><xsl:value-of select="rss/channel/title" /></h1>
          <h2>Posts</h2>

          <xsl:apply-templates select="rss/channel/item" />

        </main>
        <footer>
        </footer>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="rss/channel/item">
    <article>
      <h3 class="post-listing">
        <a>
          <xsl:attribute name="href">
            <xsl:value-of select="link" />
          </xsl:attribute>
          <xsl:value-of select="title" />
        </a>
      </h3>
      <p class=" [ line-clamp ] "><xsl:value-of select="description" /></p>
    </article>
  </xsl:template>

</xsl:stylesheet>

