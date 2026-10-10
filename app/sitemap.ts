import type { MetadataRoute } from "next"
import { SITE_URL } from "@/utils/seo"

export const dynamic = "force-static"

/** Export only public pages; reactor query URLs and previews are not indexed. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "explorer", "create"].map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }))
}
