import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;

  // Try multiple light pollution tile sources
  const sources = [
    `https://tiles.lightpollutionmap.info/VIIRS_2022/${z}/${x}/${y}.png`,
    `https://map.lightpollutionmap.app/tiles/VIIRS_2023/${z}/${x}/${y}.png`,
    `https://djlorenz.github.io/astronomy/lp2020/overlay/tiles/${z}/${x}/${y}.png`,
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AuroraAddict/1.0',
        },
      });

      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          },
        });
      }
    } catch (error) {
      // Try next source
      continue;
    }
  }

  // If all sources fail, return a transparent tile
  return new NextResponse(null, { status: 404 });
}
