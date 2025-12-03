import {NextRequest, NextResponse} from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "@/lib/mongodb";
import Event from '@/database/event.model';


/**
 * Create a new event from multipart/form-data and persist it to the database.
 *
 * Expects form fields including `image` (file), `tags` (JSON string), and `agenda` (JSON string). Uploads the provided image to Cloudinary, assigns the uploaded image URL to the event, saves the event document, and returns the created record on success.
 *
 * @param req - Incoming NextRequest containing multipart/form-data with event fields and the `image` file
 * @returns JSON response with a success or error message. On success (status 201) includes the created event object; responds with status 400 for malformed input (e.g., missing image or invalid JSON fields) and 500 for server errors.
 */
export async function POST(req: NextRequest){    try{
        await connectDB();
        console.log("1. 🚀 ROUTE: Handing data to the Model...");
        const formData = await req.formData();
        
        let event;
        
        try {
            event = Object.fromEntries(formData.entries());
        } catch (e) {
            return NextResponse.json({message: 'Invalid JSON data format'}, {status: 400});
        }

        const file = formData.get('image') as File;

        if(!file)  return NextResponse.json({message: 'Image file is required'}, {status: 400})

     let tags = JSON.parse(formData.get('tags') as string);
    let agenda = JSON.parse(formData.get('agenda') as string);



        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if(error) return reject(error);
                resolve(results);
            }).end(buffer);
        });

        event.image = (uploadResult as { secure_url: string}).secure_url;


        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        return NextResponse.json({message: 'Event Created successfully', event: createdEvent}, {status: 201});
        
    } catch (e) {
        console.error(e);
        return NextResponse.json({message : 'Event Creation Failed', error: e instanceof Error ? e.message: 'Unknown'}, {status: 500});
    }
}

/**
 * Handle GET requests to retrieve all events sorted by newest first.
 *
 * @returns A NextResponse with a JSON body: on success `{ message, events }` and HTTP status 200; on failure `{ message, error }` and HTTP status 500.
 */
export async function GET(){
    try {
        await connectDB();

        const events = await Event.find().sort({createdAt: -1});

        return NextResponse.json({ message: 'Events fetched successfully', events}, {status: 200});
        
    } catch (e) {
        return NextResponse.json({message: 'Event Fetching failed', error:e}, { status: 500});
    }
}