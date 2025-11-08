import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.nasa.gov/DONKI/HSS?startDate=${startDate}&endDate=${endDate}&api_key=NIXvIqoTvk1qIplmptffaH4sQYgTnlDD6bH4kIYM`,
      {
        headers: {
          "User-Agent": "AuroraAddict/1.0",
        },
      }
    );

    if (!response.ok) {
      console.warn("HSS API returned error:", response.status);
      return NextResponse.json(
        { error: "NASA API error", status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching coronal hole data:", error);
    return NextResponse.json(
      { error: "Failed to fetch coronal hole data" },
      { status: 500 }
    );
  }
}
