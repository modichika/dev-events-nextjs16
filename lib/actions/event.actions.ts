'use server';

import Event from '@/database/event.model';
import connectDB from "@/lib/mongodb";


// Add this to lib/actions/event.actions.ts

export const getAllEvents = async () => {
    try {
        await connectDB();

        // Find all events, sort by newest first
        const events = await Event.find({}).sort({ createdAt: -1 }).lean();

        // Convert MongoDB objects to plain JSON to avoid Next.js warnings
        // Return it as an object { events: [] } to match your page structure
        return { events: JSON.parse(JSON.stringify(events)) };

    } catch (error) {
        console.error("❌ Error fetching all events:", error);
        return { events: [] };
    }
}

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        await connectDB();

        // 1. Find the current event
        const event = await Event.findOne({ slug });

        // Safety Check
        if (!event) {
            console.log("❌ DEBUG: Current event not found for slug:", slug);
            return [];
        }

        console.log("🔍 DEBUG: Current Event Found:", event.title);
        console.log("🏷️  DEBUG: Tags to match:", event.tags);
        console.log("📂 DEBUG: Category to match:", event.category);

        // 2. Define a broader query (Category OR Tags)
        const query = {
            _id: { $ne: event._id }, // Don't show the current event
            $or: [
                { category: event.category },      // Match by Category (Easiest match)
                { tags: { $in: event.tags || [] } } // Match by Tags (if any exist)
            ]
        };

        // 3. Run the query
        const similarEvents = await Event.find(query).limit(3).lean();

        console.log("✅ DEBUG: Found similar events:", similarEvents.length);

        return similarEvents;

    } catch (error) {
        console.error("❌ DEBUG: Error fetching similar events:", error);
        return [];
    }
}