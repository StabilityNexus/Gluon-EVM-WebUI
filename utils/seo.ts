import type { Metadata } from "next"

// Keep this in sync with the root deployment configured in GitHub Pages.
export const SITE_URL = "https://evm.gluon.stability.nexus/"

/** Metadata for a page at a relative path under the sitemap's deployment URL. */
export function createPageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const url = new URL(path, SITE_URL).toString()
  const image = new URL("og-image.png", SITE_URL).toString()

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Gluon",
      type: "website",
      locale: "en_US",
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: "Gluon - Decentralized Stablecoin Creation Platform",
        type: "image/png",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@StabilityNexus",
      site: "@StabilityNexus",
    },
  }
}
