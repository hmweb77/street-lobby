import { createClient } from 'next-sanity'



export const client = createClient({
  projectId: "pkg5i4cw",
  dataset: 'production',
  apiVersion:'2023-10-01',
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
})
