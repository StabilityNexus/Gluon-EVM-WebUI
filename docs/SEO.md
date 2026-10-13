# Search indexing and sitemap deployment

The public WebUI is hosted at https://evm.gluon.stability.nexus/ through GitHub
Pages. This is a development WebUI, not evidence of a production protocol deployment.

## Deployment paths and metadata

- The custom domain serves the site at its root. `next.config.mjs` sets empty
  `basePath` and `assetPrefix` values.
- The Pages workflow uses `actions/configure-pages` without rewriting the Next.js
  configuration. Do not reintroduce the old `/Gluon-EVM-WebUI` URL prefix.
- `utils/seo.ts` defines the public URL used by canonical metadata, Open Graph,
  social images, the sitemap, and robots.txt.
- `app/sitemap.ts` exports the homepage, explorer, and creation page.
- `/c` requires a reactor query parameter. It remains outside the sitemap with
  `noindex, follow` metadata. Wallet-specific URLs and previews are not sitemap entries.
- GitHub Pages already has the custom domain configured. Actions-based publishing
  does not require a repository CNAME file; domain settings remain in GitHub Pages.

After deployment, check:

```bash
curl -f https://evm.gluon.stability.nexus/
curl -f https://evm.gluon.stability.nexus/explorer
curl -f https://evm.gluon.stability.nexus/create
curl -f https://evm.gluon.stability.nexus/sitemap.xml
curl -f https://evm.gluon.stability.nexus/robots.txt
```

The sitemap must contain exactly the three public page URLs on this domain.
Check that canonical and Open Graph URLs use the same domain and that scripts,
styles and images load from root paths rather than the old repository prefix.

## Root robots.txt

`app/robots.ts` statically exports https://evm.gluon.stability.nexus/robots.txt:

```text
User-agent: *
Allow: /
Disallow: /pr-preview/

Sitemap: https://evm.gluon.stability.nexus/sitemap.xml
```

The current workflow does not deploy PR previews. If previews are added, exclude
those URLs from the sitemap. Disallow blocks crawling but does not guarantee that
linked URLs cannot appear in search results. Use crawlable noindex metadata where
preventing preview indexing is required.

## Search Console handoff

After the updated export is deployed, send Bruno this sitemap URL:
https://evm.gluon.stability.nexus/sitemap.xml.

It can be submitted under the verified `stability.nexus` Domain property, which
covers this subdomain, or an authorized URL-prefix property for the exact site URL.
The old github.io sitemap entries must not remain in this sitemap: they belong to
another host and caused the reported URL-not-allowed error.

Domain-property DNS verification and Search Console permissions remain the domain
owner's responsibility. Do not invent verification tokens. Sitemap submission helps
discovery but does not guarantee indexing or ranking improvements.

## References

- [GitHub: managing a custom Pages domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Google: create and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: robots.txt location and rules](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)
- [Google: Search Console property types](https://support.google.com/webmasters/answer/34592)
- [Next.js 14: sitemap metadata files](https://nextjs.org/docs/14/app/api-reference/file-conventions/metadata/sitemap)
