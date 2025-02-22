export const propertyQueries = {
  getAllProperties: `*[_type == "property"]{
    _id,
    name,
    location,
    roomType,
    priceWinter,
    priceSummer,
    colivingCapacity,
    propertyType,
    description,
    "imageUrl": mainImage.asset->url
  }`,

  getLocations: `*[_type == "location"]{
    _id,
    name,
    value
  }`,

  getRoomTypes: `*[_type == "roomType"]{
    _id,
    name,
    value
  }`,

  getPropertyTypes: `*[_type == "propertyType"]{
    _id,
    name,
    value
  }`
};


// Queries with year Note: This will be removed in future version when we make the query dynamic with firebase firestore realtime
export const roomQueriesWithYear = `*[_type == "room" && isAvailable == true]{
          _id,
          roomNumber,
          title,
          roomType,
          priceWinter,
          priceSummer,
          services,
          "property": property->{
            propertyName,
            slug
          },
          "slug": slug.current,
          "imageUrl": property->images[0].asset->url,
          isAvailable,
          "bookedPeriods": bookedPeriods[year == $year],
          "availableSemesters": availableSemesters[year == $year]
        }`;
