import { sanityClient } from "@/lib/sanity";

export async function generateStaticParams() {
  const query = `*[_type == "property"]{ slug }`;
  const properties = await sanityClient.fetch(query);
  return properties.map((property) => ({ slug: property.slug.current }));
}

export default async function PropertyPage({ params }) {
  const query = `*[_type == "property" && slug.current == $slug][0]{
    propertyName,
    location,
    colivingCapacity,
    propertyType,
    alLicense,
    images[]{asset->{url}},
    "rooms": *[_type == "room" && references(^._id)]{
      roomNumber,
      slug,
      roomType,
      priceWinter,
      priceSummer
    }
  }`;
  
  const property = await sanityClient.fetch(query, { slug: params.slug });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{property.propertyName}</h1>
      <p className="text-gray-600">{property.location} | {property.propertyType} | {property.colivingCapacity}</p>
      <p className="text-gray-500">AL License: {property.alLicense}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {property.images.map((image, index) => (
          <img key={index} src={image.asset.url} alt={property.propertyName} className="rounded-lg" />
        ))}
      </div>
      <h2 className="text-2xl font-semibold mt-6">Rooms</h2>
      <ul>
        {property.rooms.map((room) => (
          <li key={room.slug.current}>
            <a href={`/rooms/${room.slug.current}`} className="text-blue-500 hover:underline">
              Room {room.roomNumber} - {room.roomType} ({room.priceWinter})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
