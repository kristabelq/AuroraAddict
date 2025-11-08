import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing image URL parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "AuroraAddict/1.0 (Aurora Camera Aggregator)",
      },
      // Don't follow redirects automatically - let the client handle it
      redirect: "manual",
    });

    if (!response.ok && response.status !== 301 && response.status !== 302) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Handle redirects
    if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.get("location");
      if (redirectUrl) {
        const redirectResponse = await fetch(redirectUrl, {
          headers: {
            "User-Agent": "AuroraAddict/1.0 (Aurora Camera Aggregator)",
          },
        });

        const imageBuffer = await redirectResponse.arrayBuffer();
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": redirectResponse.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        });
      }
    }

    const imageBuffer = await response.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error fetching camera image:", error);
    return NextResponse.json(
      { error: "Failed to fetch camera image" },
      { status: 500 }
    );
  }
}
