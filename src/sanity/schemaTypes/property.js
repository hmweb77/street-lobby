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
      name: "propertyDescriptions",
      title: "Property Descriptions",
      type: "string",
    },
    {
      name: "location",
      title: "Neighborhood Map",
      type: "reference",
      to: [{ type: "location" }],
    },
    {
      name: "propertiesMap", // This name will be used in GROQ
      title: "Properties Map",
      type: "reference",
      to: [{ type: "propertiesmap" }]
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
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image" }],
      options: { layout: "grid" },
      validation: (Rule) => Rule.max(10),
    },
    {
      name: "availableRooms",
      title: "Available Rooms",
      type: "number",
    },
  ],
};
