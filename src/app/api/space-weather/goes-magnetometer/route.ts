import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use NOAA 1-minute estimated planetary K index, which updates frequently.
    // This reflects substorm activity better than trying to get magnetometer data.
    // Format: [{ time_tag, kp_index, estimated_kp, kp }, ...]
    const response = await fetch(
      "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json",
      {
        headers: {
          "User-Agent": "AuroraAddict/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status}`);
    }

    const data = await response.json();

    // Calculate substorm indicator from recent Kp changes
    // Substorms show as rapid Kp increases
    if (data && data.length > 10) {
      const recent = data.slice(-10); // Last 10 readings (10 minutes)
      const kpValues = recent
        .map((r: any) => parseFloat(r.estimated_kp))
        .filter((v: number) => !isNaN(v));

      if (kpValues.length > 0) {
        const currentKp = kpValues[kpValues.length - 1];
        const avgKp = kpValues.reduce((a: number, b: number) => a + b, 0) / kpValues.length;
        const maxKp = Math.max(...kpValues);

        // Substorm indicators:
        // 1. Current Kp >= 4 with recent increase
        // 2. Kp increased by 1+ in last 10 minutes
        const kpIncreased = kpValues.length > 5 && (currentKp > kpValues[0] + 0.7);
        const substormActive = (currentKp >= 4 && kpIncreased) || (currentKp >= 5);

        return NextResponse.json({
          currentKp: currentKp,
          avgKp: avgKp,
          maxKp: maxKp,
          kpIncreased: kpIncreased,
          substormActive: substormActive,
          rawData: data
        });
      }
    }

    return NextResponse.json({ substormActive: false, currentKp: 0 });
  } catch (error) {
    console.error("Error fetching substorm data:", error);
    return NextResponse.json(
      { error: "Failed to fetch substorm data", substormActive: false },
      { status: 500 }
    );
  }
}
