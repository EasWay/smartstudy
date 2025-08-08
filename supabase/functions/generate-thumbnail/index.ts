// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import Jimp from "npm:jimp@0.22.12";
import { Buffer } from "node:buffer";

console.log("Hello from Functions!")

// Helper function to get the appropriate icon URL based on file type
function getIconUrlForFileType(filePath: string, bucketName: string, supabaseClient: any): string {
  const fileExtension = filePath.split('.').pop()?.toLowerCase();
  let iconFileName = 'default.png'; // Default icon

  switch (fileExtension) {
    case 'pdf':
      iconFileName = 'pdf.png';
      break;
    case 'doc':
    case 'docx':
      iconFileName = 'doc.png';
      break;
    case 'xls':
    case 'xlsx':
      iconFileName = 'xls.png';
      break;
    case 'ppt':
    case 'pptx':
      iconFileName = 'ppt.png';
      break;
    case 'mp4':
    case 'mov':
    case 'avi':
      iconFileName = 'video.png';
      break;
    case 'mp3':
    case 'wav':
      iconFileName = 'audio.png';
      break;
    // Add more cases as needed
  }

  const iconPath = `document_icons/${iconFileName}`;
  const { data: publicUrlData } = supabaseClient.storage
    .from(bucketName)
    .getPublicUrl(iconPath);

  return publicUrlData.publicUrl;
}


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

console.log(`Function "generate-thumbnail" up and running!`);

serve(async (req) => {
  try {
    const { record } = await req.json();
    const bucketName = record.bucket_id;
    const filePath = record.name;

    console.log(`File ${filePath} uploaded to bucket ${bucketName}`);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // Download the file
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error("Error downloading file:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!data) {
      console.error("No data received for file:", filePath);
      return new Response(JSON.stringify({ error: "No file data" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }

console.log(`File ${filePath} downloaded successfully.`);

    let thumbnailUrl: string | undefined;

    if (data.type.startsWith("image/")) {
      const imageBuffer = await data.arrayBuffer();
      const image = await Jimp.read(Buffer.from(imageBuffer));
      const thumbnailBuffer = await image
        .resize(200, Jimp.AUTO) // resize to 200px width, auto height
        .quality(80) // set JPEG quality
        .getBufferAsync(Jimp.MIME_JPEG);

      // Generate thumbnail filename
      const originalFileName = filePath.split('/').pop()?.split('.')[0] || 'untitled';
      const truncatedFileName = originalFileName.substring(0, 50); // Truncate to 50 characters
      const thumbnailName = `thumbnails/${truncatedFileName}_thumbnail.jpg`;

      // Upload thumbnail
      const { error: uploadError } = await supabaseClient.storage
        .from(bucketName)
        .upload(thumbnailName, thumbnailBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error("Error uploading thumbnail:", uploadError);
        return new Response(JSON.stringify({ error: 'Failed to upload thumbnail', details: uploadError }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { data: publicUrlData } = supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(thumbnailName);

      thumbnailUrl = publicUrlData.publicUrl;
      console.log(`Thumbnail uploaded to ${thumbnailUrl}`);
    } else {
      // For non-images, use a document-specific icon
      thumbnailUrl = getIconUrlForFileType(filePath, bucketName, supabaseClient);
      console.log(`Using document icon for ${filePath}: ${thumbnailUrl}`);
    }

    // Update database record
    if (thumbnailUrl) {
      console.log(`Attempting to update resource with filePath: ${filePath}`);
      const { error: updateError } = await supabaseClient
        .from("resources") // Assuming your table is named 'resources'
        .update({ thumbnail_url: thumbnailUrl })
        .eq("file_path", filePath); // Assuming 'file_path' is the column storing the file path

      if (updateError) {
        console.error("Error updating database:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        });
      }
      console.log(`Database updated for resource with filePath: ${filePath}`);
    }

    return new Response(JSON.stringify({ message: "Thumbnail processing complete." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-thumbnail' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
