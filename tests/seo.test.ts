import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import robots from "@/app/robots"
import { createPageMetadata, SITE_URL } from "@/utils/seo"

describe("custom-domain search metadata", () => {
  it("lists only the public pages under the deployed domain", () => {
    expect(SITE_URL).toBe("https://evm.gluon.stability.nexus/")
    expect(sitemap().map(({ url }) => url)).toEqual([
      SITE_URL,
      `${SITE_URL}explorer`,
      `${SITE_URL}create`,
    ])
  })

  it("uses matching canonical, Open Graph and social-image URLs", () => {
    for (const path of ["", "explorer", "create"]) {
      const url = new URL(path, SITE_URL).toString()
      const image = new URL("og-image.png", SITE_URL).toString()
      expect(createPageMetadata(path, "Gluon", "Gluon reactor interface")).toMatchObject({
        alternates: { canonical: url },
        openGraph: { url, images: [{ url: image }] },
        twitter: { images: [image] },
      })
    }
  })

  it("allows crawling at the root and points to the same-domain sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/pr-preview/" },
      sitemap: `${SITE_URL}sitemap.xml`,
    })
  })
})
