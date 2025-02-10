export const propertySchema = {
  name: "property",
  title: "Property",
  type: "document",
  fields: [
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "propertyName",
        maxLength: 200,
      },
    },
    {
      name: "propertyName",
      title: "Property Name",
      type: "string",
    },
    {
      name: "location",
      title: "Location",
      type: "string",
      options: {
        list: ["Anjos", "Avenidas Novas", "Estefânia", "Costa de Caparica"],
      },
    },
    {
      name: "colivingCapacity",
      title: "Coliving Capacity",
      type: "number",
    },
    {
      name: "propertyType",
      title: "Property Type",
      type: "string",
      options: {
        list: ["House", "Apartment", "Any"],
      },
    },
    {
      name: "alLicense",
      title: "AL License",
      type: "string",
    },
    {
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image" }],
      options: { layout: "grid" },
      validation: Rule => Rule.max(10),
    },
    {
      name: "availableRooms",
      title: "Available Rooms",
      type: "number",
    },
  ],
};
