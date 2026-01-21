import { NextResponse } from 'next/server';
import { processConversion, verifyWebhookSignature } from '@/lib/conversion-tracker';

/**
 * POST /api/webhooks/conversions
 *
 * Generic webhook endpoint for receiving conversion events from affiliate platforms
 *
 * Expected payload structure (varies by platform):
 * {
 *   "platform": "booking" | "agoda" | "getyourguide" | "viator",
 *   "eventType": "booking" | "confirmation" | "cancellation" | "completion",
 *   "bookingReference": "ABC123",
 *   "bookingValue": 450.00,
 *   "currency": "EUR",
 *   "checkInDate": "2025-12-01",
 *   "checkOutDate": "2025-12-05",
 *   "guests": 2,
 *   "customerEmail": "customer@example.com",
 *   "customerId": "cust_123"
 * }
 */
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const {
      platform,
      eventType,
      bookingReference,
      bookingValue,
      currency,
      checkInDate,
      checkOutDate,
      guests,
      customerEmail,
      customerId,
    } = payload;

    // Validate required fields
    if (!platform || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, eventType' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ['booking', 'agoda', 'getyourguide', 'viator', 'tripadvisor'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ['booking', 'confirmation', 'cancellation', 'completion'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify webhook signature if present
    const signature = request.headers.get('x-webhook-signature');
    if (signature) {
      const webhookSecret = process.env[`${platform.toUpperCase()}_WEBHOOK_SECRET`];

      if (webhookSecret) {
        const isValid = verifyWebhookSignature(
          platform,
          rawBody,
          signature,
          webhookSecret
        );

        if (!isValid) {
          console.error(`Invalid webhook signature for platform: ${platform}`);
          return NextResponse.json(
            { error: 'Invalid webhook signature' },
            { status: 401 }
          );
        }
      }
    }

    // Parse dates
    const parsedCheckInDate = checkInDate ? new Date(checkInDate) : undefined;
    const parsedCheckOutDate = checkOutDate ? new Date(checkOutDate) : undefined;

    // Process conversion
    const result = await processConversion(
      {
        platform,
        eventType,
        bookingReference,
        bookingValue: bookingValue ? parseFloat(bookingValue) : undefined,
        currency,
        checkInDate: parsedCheckInDate,
        checkOutDate: parsedCheckOutDate,
        guests: guests ? parseInt(guests) : undefined,
        customerEmail,
        customerId,
      },
      payload, // Store full webhook payload
      signature || undefined
    );

    if (!result.success) {
      // Log failed conversion but return 200 to prevent retries for duplicates
      console.error('Conversion processing failed:', result.error);

      if (result.error === 'Duplicate conversion event') {
        return NextResponse.json({
          success: true,
          message: 'Duplicate event ignored',
        });
      }

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      conversionEventId: result.conversionEventId,
      message: 'Conversion processed successfully',
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/conversions
 *
 * Health check endpoint for webhook setup verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Conversion webhook endpoint is active',
    supportedPlatforms: ['booking', 'agoda', 'getyourguide', 'viator', 'tripadvisor'],
    supportedEventTypes: ['booking', 'confirmation', 'cancellation', 'completion'],
  });
}
