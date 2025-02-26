import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { Readable } from "stream"; // Import Node.js Readable stream

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("video");
    const courseId = formData.get("courseId");
    const sectionId = formData.get("sectionId");
    const chapterId = formData.get("chapterId");

    if (!file || !courseId || !sectionId || !chapterId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert the File object to a buffer or readable stream
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create a Readable stream from the buffer
    const fileStream = Readable.from(fileBuffer);

    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          public_id: `courses/${courseId}/${sectionId}/${chapterId}`,
          folder: "course_videos",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      fileStream.pipe(uploadStream); // Pipe the readable stream to Cloudinary
    });

    return NextResponse.json({
      message: "Video uploaded successfully",
      videoUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { message: "Error uploading video", error: error.message },
      { status: 500 }
    );
  }
}