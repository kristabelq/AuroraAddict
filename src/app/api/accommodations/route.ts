import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { toGeomagneticCoordinates, getAuroralOvalLatitude } from "@/lib/geomagneticCoordinates";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const minKp = searchParams.get("minKp") ? parseFloat(searchParams.get("minKp")!) : null;
    const features = searchParams.get("features")?.split(",") || [];

    // Build where clause
    const where: any = {
      userType: "business",
      businessServices: {
        has: "accommodation",
      },
      verificationStatus: "verified",
      latitude: {
        not: null,
      },
      longitude: {
        not: null,
      },
    };

    if (country && country !== "all") {
      where.businessCountry = country;
    }

    // Fetch accommodations with room types
    const accommodations = await prisma.user.findMany({
      where,
      include: {
        roomTypes: {
          where: {
            isActive: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: [
        { businessCountry: "asc" },
        { businessCity: "asc" },
        { businessName: "asc" },
      ],
    });

    // Fetch all sightings for success rate calculation
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const allSightings = await prisma.sighting.findMany({
      where: {
        createdAt: {
          gte: oneYearAgo,
        },
      },
      select: {
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    // Calculate aurora metrics for each accommodation
    const accommodationsWithMetrics = accommodations
      .map((accommodation) => {
        if (!accommodation.latitude || !accommodation.longitude) {
          return null;
        }

        // Convert to geomagnetic coordinates
        const { geomagneticLat } = toGeomagneticCoordinates(
          accommodation.latitude,
          accommodation.longitude
        );

        // Calculate minimum Kp needed to see aurora from this location
        // Aurora needs to extend to the equatorward edge of the oval
        // Formula: equatorwardEdge = 67 - 2.5 * Kp
        // Solve for Kp: Kp = (67 - geomagneticLat) / 2.5
        const minKpForVisibility = Math.max(0, Math.ceil((67 - geomagneticLat) / 2.5));

        // Calculate actual success rate from real sightings
        // Find sightings within ~100km radius (approximately 1 degree)
        const radiusInDegrees = 1.0;
        const nearbySightings = allSightings.filter((sighting) => {
          const latDiff = Math.abs(sighting.latitude - accommodation.latitude);
          const lonDiff = Math.abs(sighting.longitude - accommodation.longitude);
          // Simple distance approximation (good enough for this use case)
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
          return distance <= radiusInDegrees;
        });

        // Count unique days with sightings
        const uniqueDays = new Set(
          nearbySightings.map((s) => s.createdAt.toISOString().split("T")[0])
        );
        const daysWithSightings = uniqueDays.size;
        const actualSuccessRate = Math.round((daysWithSightings / 365) * 100);
        const hasSightingData = daysWithSightings > 0;

        // Estimate percentage of nights with aurora sightings
        // Based on geomagnetic latitude:
        // 65°+ (Tromsø, Fairbanks): 70-90% of clear nights (Sept-March)
        // 62-65° (Reykjavik, Yellowknife): 40-60%
        // 58-62° (Oslo, Anchorage): 20-35%
        // 50-58° (Edinburgh, southern cities): 5-15%
        // <50°: <5%
        let estimatedSightingPercentage = 0;
        if (geomagneticLat >= 65) {
          estimatedSightingPercentage = 70 + (geomagneticLat - 65) * 4; // 70-90%
        } else if (geomagneticLat >= 62) {
          estimatedSightingPercentage = 40 + (geomagneticLat - 62) * 6.67; // 40-60%
        } else if (geomagneticLat >= 58) {
          estimatedSightingPercentage = 20 + (geomagneticLat - 58) * 5; // 20-40%
        } else if (geomagneticLat >= 50) {
          estimatedSightingPercentage = 5 + (geomagneticLat - 50) * 1.875; // 5-20%
        } else {
          estimatedSightingPercentage = Math.max(1, geomagneticLat / 10); // <5%
        }

        estimatedSightingPercentage = Math.min(90, Math.max(1, estimatedSightingPercentage));

        // Quality rating based on geomagnetic latitude
        let auroraQuality: "Excellent" | "Very Good" | "Good" | "Fair" | "Limited" = "Limited";
        if (geomagneticLat >= 65) auroraQuality = "Excellent";
        else if (geomagneticLat >= 62) auroraQuality = "Very Good";
        else if (geomagneticLat >= 58) auroraQuality = "Good";
        else if (geomagneticLat >= 50) auroraQuality = "Fair";

        // Check if has requested features
        const roomTypeAmenities = accommodation.roomTypes.flatMap((rt) => rt.amenities);
        const hasRequestedFeatures =
          features.length === 0 ||
          features.every((feature) =>
            roomTypeAmenities.some((amenity) =>
              amenity.toLowerCase().includes(feature.toLowerCase())
            )
          );

        if (!hasRequestedFeatures) {
          return null;
        }

        // Filter by minKp if specified
        if (minKp !== null && minKpForVisibility > minKp) {
          return null;
        }

        return {
          id: accommodation.id,
          businessName: accommodation.businessName,
          city: accommodation.businessCity,
          country: accommodation.businessCountry,
          latitude: accommodation.latitude,
          longitude: accommodation.longitude,
          description: accommodation.businessDescription,
          website: accommodation.businessWebsite,

          // Aurora metrics
          geomagneticLat: Math.round(geomagneticLat * 100) / 100,
          minKpRequired: minKpForVisibility,
          estimatedSightingPercentage: Math.round(estimatedSightingPercentage),
          actualSuccessRate, // Based on real sightings
          daysWithSightings, // Number of unique days with sightings
          hasSightingData, // Whether we have real sighting data for this location
          auroraQuality,

          // Room types
          roomTypes: accommodation.roomTypes.map((rt) => ({
            id: rt.id,
            name: rt.name,
            description: rt.description,
            capacity: rt.capacity,
            priceFrom: rt.priceFrom,
            currency: rt.currency,
            amenities: rt.amenities,
            images: rt.images,
            coverImage: rt.coverImage,
          })),

          // Stats
          totalRoomTypes: accommodation.roomTypes.length,
          hasGlassIgloo: roomTypeAmenities.some(
            (a) =>
              a.toLowerCase().includes("glass") &&
              (a.toLowerCase().includes("igloo") || a.toLowerCase().includes("dome"))
          ),
          hasAuroraCabin: roomTypeAmenities.some((a) =>
            a.toLowerCase().includes("aurora")
          ),
          hasPrivateSauna: roomTypeAmenities.some((a) =>
            a.toLowerCase().includes("sauna")
          ),
          hasHotTub: roomTypeAmenities.some((a) =>
            a.toLowerCase().includes("hot tub") || a.toLowerCase().includes("jacuzzi")
          ),
        };
      })
      .filter((a) => a !== null);

    // Get unique countries for filter
    const countries = [...new Set(accommodations.map((a) => a.businessCountry))].sort();

    return NextResponse.json({
      accommodations: accommodationsWithMetrics,
      countries,
      total: accommodationsWithMetrics.length,
    });
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return NextResponse.json(
      { error: "Failed to fetch accommodations" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
