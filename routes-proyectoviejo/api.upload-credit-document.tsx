import { json, type ActionFunctionArgs } from "@remix-run/node";
import { uploadMedia } from "~/lib/digitalocean-spaces.server";
import { requireClerkUser } from "~/lib/auth-clerk.server";

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  try {
    // Only require authenticated user (not admin) for credit document uploads
    await requireClerkUser(args);

    // Only allow POST requests
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type - allow images and PDFs for credit documents
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      return json({ error: "Only images (JPG, PNG, WebP) and PDF files are allowed" }, { status: 400 });
    }

    // Validate file size - more generous limits for documents
    const maxFileSize = 10 * 1024 * 1024; // 10MB for documents
    
    if (file.size > maxFileSize) {
      return json({ error: "File too large. Maximum 10MB allowed." }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the file to DigitalOcean Spaces in a specific folder for credit documents
    const result = await uploadMedia(buffer, "credit-documents");

    // Return the URL and other info
    return json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      type: isPDF ? 'pdf' : 'image',
      size: file.size,
      name: file.name
    });
  } catch (error) {
    console.error("Error uploading credit document:", error);
    return json(
      { error: "Failed to upload document", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// This is a resource route, so no default export is needed