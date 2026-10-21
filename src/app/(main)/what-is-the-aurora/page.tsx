import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "What Is the Aurora Borealis & Aurora Australis?",
  description:
    "A complete guide to the aurora borealis (Northern Lights) and aurora australis (Southern Lights): what causes them, their colours, and when and where to see them.",
  alternates: { canonical: "/what-is-the-aurora" },
  keywords: [
    "what is the aurora borealis",
    "what is the aurora australis",
    "what causes the northern lights",
    "northern lights vs southern lights",
    "aurora borealis meaning",
    "aurora australis",
    "when to see the aurora",
    "where to see the northern lights",
  ],
  openGraph: {
    type: "article",
    url: "https://auroraintel.io/what-is-the-aurora",
    title: "What Is the Aurora Borealis & Aurora Australis?",
    description:
      "What causes the Northern Lights (aurora borealis) and Southern Lights (aurora australis), their colours, and when and where to see them.",
  },
};

const faqs: { question: string; answer: string }[] = [
  {
    question: "What is the aurora borealis?",
    answer:
      "The aurora borealis, or Northern Lights, is a natural light display in the night sky over high northern latitudes. It happens when charged particles from the solar wind are funnelled by Earth's magnetic field into the upper atmosphere, where they collide with oxygen and nitrogen atoms and make them glow.",
  },
  {
    question: "What is the aurora australis?",
    answer:
      "The aurora australis, or Southern Lights, is the southern-hemisphere counterpart of the aurora borealis. It forms by exactly the same process around the south magnetic pole and appears over places such as Tasmania, southern New Zealand and Antarctica.",
  },
  {
    question: "What is the difference between the aurora borealis and aurora australis?",
    answer:
      "There is no physical difference — only location. 'Borealis' means northern and 'australis' means southern. Both auroras are produced by the same solar wind and often occur at the same time, forming near-mirror images around the north and south magnetic poles.",
  },
  {
    question: "What causes the aurora?",
    answer:
      "The aurora is caused by the solar wind — a stream of charged particles from the Sun. When the interplanetary magnetic field carried by the solar wind points south (a negative Bz), it reconnects with Earth's magnetic field and injects energy into the magnetosphere. Electrons rain down along the field lines into the atmosphere at about 100–300 km altitude, exciting gas atoms that then emit light.",
  },
  {
    question: "What causes the different aurora colours?",
    answer:
      "Colour depends on which gas is excited and at what altitude. Green (557.7 nm), the most common colour, comes from oxygen around 100–250 km. Red (630.0 nm) comes from oxygen above about 250 km. Blue and purple come from nitrogen lower in the atmosphere, and pink edges are a mix of red and blue.",
  },
  {
    question: "When is the best time to see the aurora?",
    answer:
      "The aurora is best seen on dark, clear nights away from city lights, typically within a few hours of local midnight. Autumn and spring (around the September and March equinoxes) are statistically more active, and activity rises near the peak of the Sun's 11-year cycle. You also need geomagnetic activity — a higher Kp index — on the night itself.",
  },
  {
    question: "Where can you see the aurora?",
    answer:
      "In the north, prime locations include Iceland, northern Norway, Finland, Sweden, Canada, Alaska and Greenland. In the south, look to Tasmania, the South Island of New Zealand, and Antarctica. During strong geomagnetic storms the aurora can be seen much farther from the poles than usual.",
  },
  {
    question: "What Kp index do you need to see the aurora?",
    answer:
      "The Kp index (0–9) measures geomagnetic activity; higher Kp pushes the auroral oval toward lower latitudes. At Kp 0–2 the aurora stays near the Arctic and Antarctic circles. Around Kp 5 (a G1 storm) it can reach places like Scotland, the northern United States and southern New Zealand. At Kp 7–9 it may be visible well into mid-latitudes.",
  },
  {
    question: "Can you predict the aurora?",
    answer:
      "Yes, within limits. Short-term forecasts (30–60 minutes ahead) use real-time solar wind data from the DSCOVR satellite at the L1 point. Multi-day outlooks use the Kp forecast and tracking of CMEs and coronal holes. Aurora Intel combines these into a live forecast and alerts.",
  },
];

export default function WhatIsTheAuroraPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": "https://auroraintel.io/what-is-the-aurora#article",
    headline: "What Is the Aurora Borealis and Aurora Australis?",
    description:
      "A complete guide to the aurora borealis (Northern Lights) and aurora australis (Southern Lights): what causes them, their colours, and when and where to see them.",
    author: { "@type": "Person", name: "Kristabel" },
    publisher: { "@id": "https://auroraintel.io/#organization" },
    datePublished: "2026-10-22",
    dateModified: "2026-10-22",
    mainEntityOfPage: "https://auroraintel.io/what-is-the-aurora",
    about: [
      { "@type": "Thing", name: "Aurora borealis" },
      { "@type": "Thing", name: "Aurora australis" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://auroraintel.io" },
      {
        "@type": "ListItem",
        position: 2,
        name: "What Is the Aurora?",
        item: "https://auroraintel.io/what-is-the-aurora",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f1419] via-[#1a1f2e] to-[#0f1419] pb-24">
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <article className="mx-auto max-w-3xl px-4 pt-10 text-gray-200">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>{" "}
          / <span className="text-gray-300">What Is the Aurora?</span>
        </nav>

        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          What Is the Aurora Borealis and Aurora Australis?
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-300">
          The <strong>aurora borealis</strong> (the Northern Lights) and the{" "}
          <strong>aurora australis</strong> (the Southern Lights) are the same natural
          phenomenon seen from opposite ends of the Earth: shimmering curtains of green,
          red and purple light caused by the solar wind striking our atmosphere. This guide
          explains what causes the aurora, why it comes in different colours, and when and
          where you can see it.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-white">What causes the aurora?</h2>
        <p className="mt-3 leading-relaxed text-gray-300">
          The Sun constantly releases a stream of charged particles called the{" "}
          <strong>solar wind</strong>. When the magnetic field carried by that solar wind
          points south — a negative <strong>Bz</strong> — it reconnects with Earth&apos;s
          magnetic field and pours energy into the magnetosphere. Electrons are accelerated
          down the field lines toward the poles and collide with oxygen and nitrogen in the
          upper atmosphere, roughly 100–300 km up. Those excited atoms release the energy as
          light, and we see the aurora. The strength of this activity is summarised by the{" "}
          <strong>Kp index</strong>, a 0–9 scale of geomagnetic disturbance.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-white">
          Aurora borealis vs aurora australis
        </h2>
        <p className="mt-3 leading-relaxed text-gray-300">
          There is no physical difference between the two — only hemisphere.{" "}
          <em>Borealis</em> is Latin for northern and <em>australis</em> for southern. Both
          auroras are driven by the same solar wind and usually appear at the same time,
          forming near-mirror images around the north and south magnetic poles. The aurora
          borealis is seen from Iceland, Scandinavia, Canada and Alaska; the aurora australis
          from Tasmania, southern New Zealand and Antarctica.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-white">
          Why does the aurora have different colours?
        </h2>
        <p className="mt-3 leading-relaxed text-gray-300">
          Colour depends on which gas glows and at what altitude. <strong>Green</strong>{" "}
          (557.7 nm) is the most common, from oxygen at about 100–250 km.{" "}
          <strong>Red</strong> (630.0 nm) comes from oxygen above ~250 km.{" "}
          <strong>Blue and purple</strong> come from nitrogen lower down, and pink fringes
          are a blend of red and blue along the lower edge of the curtains.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-white">
          When and where can you see the aurora?
        </h2>
        <p className="mt-3 leading-relaxed text-gray-300">
          You need three things: darkness (a clear, moonless sky away from light pollution),
          a view toward the poles, and geomagnetic activity on the night. Aurora is most
          likely within a couple of hours of local midnight, is statistically stronger near
          the equinoxes, and peaks with the Sun&apos;s 11-year cycle. Higher Kp pushes the
          auroral oval toward the equator: around Kp 5 the aurora can reach Scotland, the
          northern United States and southern New Zealand, while a severe storm (Kp 8–9) can
          bring it into mid-latitudes.
        </p>
        <p className="mt-3 leading-relaxed text-gray-300">
          Check the live{" "}
          <Link href="/forecast" className="text-emerald-400 hover:underline">
            Kp index forecast
          </Link>
          , see visibility for your location in the{" "}
          <Link href="/aurora-guide" className="text-emerald-400 hover:underline">
            aurora visibility guide
          </Link>
          , or open the real-time{" "}
          <Link href="/intelligence" className="text-emerald-400 hover:underline">
            aurora dashboard
          </Link>{" "}
          to see whether it&apos;s worth heading out tonight.
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-white">
          Frequently asked questions
        </h2>
        <div className="mt-4 space-y-4">
          {faqs.map((f) => (
            <details
              key={f.question}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <summary className="cursor-pointer font-medium text-white">
                {f.question}
              </summary>
              <p className="mt-2 leading-relaxed text-gray-300">{f.answer}</p>
            </details>
          ))}
        </div>
      </article>
    </main>
  );
}
