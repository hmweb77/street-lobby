import { createClient } from "@sanity/client";



export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, // Replace with your Sanity project ID
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, // Replace with your dataset name
  useCdn: true, // `true` for faster, `false` for fresh data
  apiVersion: "2023-01-01", // Use a recent Sanity API version
});


// Fetch properties
export const fetchProperties = async () => {
  const query = `*[_type == "property"]{
    _id,
    propertyName,
    location,
    colivingCapacity,
    propertyType,
    alLicense,
    images[]{asset->{url}}
  }`;
  return await sanityClient.fetch(query);
};

// Fetch rooms and link them to properties
export const fetchRooms = async () => {
  const query = `*[_type == "room"]{
    _id,
    roomNumber,
    roomType,
    priceWinter,
    priceSummer,
    property->{_id, propertyName, location, propertyType},
    images[]{asset->{url}}
  }`;
  return await sanityClient.fetch(query);
};
