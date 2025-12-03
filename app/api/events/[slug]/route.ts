import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event, { IEvent } from '@/database/event.model';

// Define params type for Next.js dynamic route
type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/events/[slug]
 * Fetches a single events by its slug
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {

      // Connect to database
      await connectDB();

    // Await and extract slug for params
    const { slug } = await params;

    // Validate slug parameter
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { message: 'Invalid slug parameter', success: false },
        { status: 400 }
      );
    }

    // Sanitize slug to prevent injection attacks
    const sanitizedSlug = slug.trim().toLowerCase();

    // Validate slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(sanitizedSlug)) {
      return NextResponse.json(
        { 
          message: 'Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens',
          success: false 
        },
        { status: 400 }
      );
    }



    // Query events by slug
    const event: IEvent | null = await Event.findOne({ slug: sanitizedSlug }).lean();

    // Handle events not found
    if (!event) {
      return NextResponse.json(
        { 
          message: `Event with slug '${sanitizedSlug}' not found`,
          success: false 
        },
        { status: 404 }
      );
    }

    // Return events data
    return NextResponse.json(
      {
        message: 'Event fetched successfully',
        success: true,
        event,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching events by slug:', error);

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('connection')) {
      return NextResponse.json(
        {
          message: 'Database connection error',
          success: false,
        },
        { status: 503 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        message: 'Failed to fetch events',
        success: false,
      },
      { status: 500 }
    );
  }
}
