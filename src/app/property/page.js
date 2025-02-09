import { sanityClient } from "@/lib/sanity";
import Link from "next/link";

export default async function PropertyList() {
  const query = `*[_type == "property"]{
    propertyName,
    location,
    slug
  }`;

  const properties = await sanityClient.fetch(query);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Our Homes</h1>
      <ul className="space-y-3">
        {properties.map((property) => (
          <li key={property.slug.current}>
            <Link href={`/property/${property.slug.current}`} className="text-blue-500 hover:underline text-xl font-semibold">
              {property.propertyName}
            </Link>
            <p className="text-gray-500">{property.location}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
