
import { client } from "@/sanity/lib/client";
import imageUrlBuilder from "@sanity/image-url";
// Initialize image URL builder with the Sanity client
const builder = imageUrlBuilder(client);


export async function getSanityImageUrl(imageRef) {
  console.log("Sanity Image Ref:", imageRef); // Debugging
  if (!imageRef?.asset?._ref) {
    console.warn("Invalid image reference:", imageRef);
    return null;
  }
  return builder.image(imageRef).url();
}
