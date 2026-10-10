# Search indexing and sitemap deployment

The current public WebUI is hosted at
https://stabilitynexus.github.io/Gluon-EVM-WebUI/. This is a development WebUI,
not evidence of a production protocol deployment.

## Repository changes

- `utils/seo.ts` defines the public deployment URL used by metadata and the sitemap.
- `app/sitemap.ts` exports a static `sitemap.xml` containing the homepage,
  reactor explorer, and reactor creation page.
- Explorer and Create have their own titles, descriptions, canonical URLs,
  Open Graph URLs, and social images.
- The `/c` interaction page requires a reactor query parameter. It is excluded
  from the sitemap and has `noindex, follow` metadata. Do not add wallet-specific
  queries or PR previews to the sitemap.

The existing GitHub Pages workflow publishes the export on pushes to `main`.
After merging, check that these URLs return HTTP 200:

```bash
curl -f https://stabilitynexus.github.io/Gluon-EVM-WebUI/sitemap.xml
curl -f https://stabilitynexus.github.io/Gluon-EVM-WebUI/explorer
curl -f https://stabilitynexus.github.io/Gluon-EVM-WebUI/create
```

Confirm that the sitemap contains exactly the intended public URLs and that the
exported Explorer and Create pages have matching canonical URLs.

## Organization-level robots.txt

Google reads robots.txt from the host root:
https://stabilitynexus.github.io/robots.txt. A file deployed at
`/Gluon-EVM-WebUI/robots.txt` cannot control crawling for this project.
This repository therefore does not publish an ineffective robots.txt under
the project path. The organization website's maintainers must merge the
following rules into the host-root file, preserving other projects' rules
and sitemap entries:

```text
User-agent: *
Allow: /
Disallow: /pr-preview/
Disallow: /Gluon-EVM-WebUI/pr-preview/

Sitemap: https://stabilitynexus.github.io/Gluon-EVM-WebUI/sitemap.xml
```

The current WebUI workflow does not deploy PR previews. If previews are added,
keep them out of the sitemap. `Disallow` prevents crawling; it does not guarantee
that a linked URL will never appear in search results. To prevent indexing,
add `noindex` metadata to the preview build and allow crawling of those URLs
so Google can read it, instead of applying the preview `Disallow` rules.

## Search Console handoff

Once the sitemap is live, post its deployed URL in the project Discord thread:
https://stabilitynexus.github.io/Gluon-EVM-WebUI/sitemap.xml.

An owner or authorized user should submit it in Google Search Console under
the matching URL-prefix property:
https://stabilitynexus.github.io/Gluon-EVM-WebUI/.
The `stability.nexus` Domain property does not cover `github.io` URLs.
If verification is needed, the owner can provide a Google HTML verification
file for the site repository or a verification meta tag. Do not invent a
verification token.

If the site moves to a `stability.nexus` subdomain, update `SITE_URL`, update
the organization's robots.txt entries, and publish robots.txt at the new
host root. Then submit the new sitemap under the verified `stability.nexus`
property and update this document's deployment URLs.

Sitemaps help discovery; submission does not guarantee indexing or improve
rankings by itself.

## References

- [Google: create and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: robots.txt location and rules](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)
- [Google: Search Console property types](https://support.google.com/webmasters/answer/34592)
- [Next.js 14: sitemap metadata files](https://nextjs.org/docs/14/app/api-reference/file-conventions/metadata/sitemap)
