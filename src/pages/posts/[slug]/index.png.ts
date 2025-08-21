import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOgImageForPost } from "@utils/generateOgImages";

export async function getStaticPaths() {
  const posts = await getCollection("blog").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return posts
    .filter(post => post.slug) // Filter out any posts without a valid slug
    .map(post => ({
      params: { slug: post.slug },
      props: post,
    }));
}

export const GET: APIRoute = async ({ props }) => {
  try {
    const imageBuffer = await generateOgImageForPost(props as CollectionEntry<"blog">);
    return new Response(imageBuffer, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    console.error("Failed to generate OG image for post:", error);
    // Return a simple fallback response when OG image generation fails
    return new Response("OG image generation failed", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};
