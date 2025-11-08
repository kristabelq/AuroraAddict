import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all sightings with location and date
    const sightings = await prisma.sighting.findMany({
      where: {
        images: {
          isEmpty: false,
        },
      },
      select: {
        location: true,
        sightingDate: true,
      },
    });

    // Country name mapping with flag emojis
    const countryMapping: Record<string, string> = {
      "Norge": "🇳🇴 Norway",
      "Norway": "🇳🇴 Norway",
      "Suomi / Finland": "🇫🇮 Finland",
      "Finland": "🇫🇮 Finland",
      "Suomi": "🇫🇮 Finland",
      "Sverige": "🇸🇪 Sweden",
      "Sweden": "🇸🇪 Sweden",
      "Iceland": "🇮🇸 Iceland",
      "Ísland": "🇮🇸 Iceland",
      "Canada": "🇨🇦 Canada",
      "United States": "🇺🇸 United States",
      "USA": "🇺🇸 United States",
      "United Kingdom": "🇬🇧 United Kingdom",
      "UK": "🇬🇧 United Kingdom",
      "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      "Denmark": "🇩🇰 Denmark",
      "Danmark": "🇩🇰 Denmark",
      "Greenland": "🇬🇱 Greenland",
      "Kalaallit Nunaat": "🇬🇱 Greenland",
      "Russia": "🇷🇺 Russia",
      "Россия": "🇷🇺 Russia",
      "Alaska": "🇺🇸 Alaska",
    };

    // Extract unique countries from location strings
    const countriesSet = new Set<string>();
    const yearsSet = new Set<number>();

    sightings.forEach((sighting) => {
      // Extract country (usually last part after last comma)
      if (sighting.location) {
        const parts = sighting.location.split(",").map((p) => p.trim());
        if (parts.length > 0) {
          const country = parts[parts.length - 1];
          // Map to English name with flag emoji, or use original if not mapped
          const mappedCountry = countryMapping[country] || country;
          countriesSet.add(mappedCountry);
        }
      }

      // Extract year from sightingDate
      if (sighting.sightingDate) {
        const year = new Date(sighting.sightingDate).getFullYear();
        if (year >= 2000 && year <= new Date().getFullYear() + 1) {
          yearsSet.add(year);
        }
      }
    });

    // Convert to sorted arrays
    const countries = Array.from(countriesSet).sort();
    const years = Array.from(yearsSet).sort((a, b) => b - a); // Most recent first

    return NextResponse.json({
      countries,
      years,
      months: [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
      ],
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
