import Link from "next/link";

/**
 * Site-wide footer with internal links. Server component → crawlable on every
 * page, which spreads internal link equity to the key SEO pages.
 */
const sections: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Learn",
    links: [
      { href: "/what-is-the-aurora", label: "What Is the Aurora?" },
      { href: "/about", label: "How Auroras Work" },
      { href: "/aurora-guide", label: "Aurora Visibility Guide" },
      { href: "/aurora-locations", label: "Where to See the Aurora" },
    ],
  },
  {
    heading: "Live Data",
    links: [
      { href: "/intelligence", label: "Aurora Dashboard" },
      { href: "/forecast", label: "Kp Index Forecast" },
      { href: "/solar-wind", label: "Solar Wind & Bz" },
      { href: "/solar-flares", label: "Solar Flares" },
      { href: "/cme-alerts", label: "CME Alerts" },
      { href: "/coronal-holes", label: "Coronal Holes" },
    ],
  },
  {
    heading: "Plan",
    links: [
      { href: "/moon-phase", label: "Moon Phase Calendar" },
      { href: "/celestial-events", label: "Celestial Events" },
      { href: "/data-sources", label: "Data Sources" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0f17] px-4 pb-24 pt-10 text-sm text-gray-400">
      <div className="mx-auto max-w-5xl">
        <p className="mb-6 max-w-2xl text-gray-400">
          <strong className="text-gray-200">Aurora Intel</strong> — live forecasts for the
          aurora borealis (Northern Lights) and aurora australis (Southern Lights), powered
          by real-time space-weather data.
        </p>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {sections.map((section) => (
            <nav key={section.heading} aria-label={section.heading}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {section.heading}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-8 text-xs text-gray-600">
          © {new Date().getFullYear()} Aurora Intel · auroraintel.io
        </p>
      </div>
    </footer>
  );
}
