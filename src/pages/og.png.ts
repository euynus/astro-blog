import type { APIRoute } from "astro";
import { generateOgImageForSite } from "@utils/generateOgImages";

export const GET: APIRoute = async () => {
  try {
    const imageBuffer = await generateOgImageForSite();
    return new Response(imageBuffer, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    console.error("Failed to generate OG image:", error);
    // Return a simple fallback response when OG image generation fails
    return new Response("OG image generation failed", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};
