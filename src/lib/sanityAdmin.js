import { createClient } from "@sanity/client";


export const sanityAdminClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'pkg5i4cw', // Replace with your Sanity project ID
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, // Replace with your dataset name
  apiVersion: "2023-01-01", // Use a recent Sanity API version
  useCdn: false,
  token: process.env.SANITY_TOKEN
})