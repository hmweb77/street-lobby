import { createClient } from 'next-sanity'



export const client = createClient({
  projectId: "pkg5i4cw",
  dataset: 'production',
  apiVersion:'2025-02-04',
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  token: process.env.NEXT_PUBLIC_SANITY_TOKEN
})
