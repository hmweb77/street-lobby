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