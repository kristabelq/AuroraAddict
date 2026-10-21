import type { MetadataRoute } from "next";

const BASE = "https://auroraintel.io";

/**
 * Generated sitemap (replaces the old static public/sitemap.xml).
 * Covers the public, crawlable content routes. Dynamic routes
 * (/hunts/[id], /businesses/[id], /profile/[username]) can be appended here
 * later by querying the database.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "hourly", priority: 1.0 },
    { path: "/what-is-the-aurora", changeFrequency: "monthly", priority: 0.9 },
    { path: "/intelligence", changeFrequency: "hourly", priority: 0.9 },
    { path: "/forecast", changeFrequency: "hourly", priority: 0.9 },
    { path: "/aurora-guide", changeFrequency: "weekly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/coronal-holes", changeFrequency: "daily", priority: 0.8 },
    { path: "/solar-wind", changeFrequency: "hourly", priority: 0.8 },
    { path: "/solar-flares", changeFrequency: "hourly", priority: 0.8 },
    { path: "/cme-alerts", changeFrequency: "daily", priority: 0.7 },
    { path: "/moon-phase", changeFrequency: "daily", priority: 0.6 },
    { path: "/celestial-events", changeFrequency: "weekly", priority: 0.6 },
    { path: "/data-sources", changeFrequency: "monthly", priority: 0.6 },
    { path: "/hunts", changeFrequency: "daily", priority: 0.7 },
    { path: "/feed", changeFrequency: "hourly", priority: 0.6 },
    { path: "/cameras", changeFrequency: "weekly", priority: 0.6 },
    { path: "/businesses", changeFrequency: "daily", priority: 0.6 },
    { path: "/experts", changeFrequency: "weekly", priority: 0.5 },
    { path: "/plan", changeFrequency: "weekly", priority: 0.5 },
  ];

  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
