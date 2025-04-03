export const locationSchema = {
  name: "location",
  title: "Location",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "descriptions",
      title: "Address Descriptions",
      type: "string",
    },
    {
      name: "additionalAddresses",
      title: "Additional Addresses",
      type: "array",
      of: [{ type: "string" }]
    },
    {
      name: "zipCode",
      title: "Zip Code",
      type: "string",
    },
    {
      name: "city",
      title: "City",
      type: "string",
    },
    {
      name: "coordinates",
      title: "Coordinates",
      type: "geopoint",
    },
  ],
};
