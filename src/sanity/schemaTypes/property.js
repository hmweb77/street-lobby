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
      type: "string",
      options: {
        list: ["3 people or less", "6 people or less", "More than 6 people", "Doesn’t matter"],
      },
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
      options: {
        layout: "grid",
      },
      validation: Rule => Rule.max(10),
    }
  ]
};

export const roomSchema = {
  name: "room",
  title: "Room",
  type: "document",
  fields: [
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: (doc) => `${doc.property?.propertyName}-room-${doc.roomNumber}`,
        maxLength: 200,
      },
    },
    {
      name: "property",
      title: "Property",
      type: "reference",
      to: [{ type: "property" }],
    },
    {
      name: "roomNumber",
      title: "Room Number",
      type: "number",
    },
    {
      name: "roomType",
      title: "Room Type",
      type: "string",
      options: {
        list: ["Single bed", "Double bed", "Twin beds", "Suite", "Any"],
      },
    },
    {
      name: "priceWinter",
      title: "Price Winter",
      type: "string",
    },
    {
      name: "priceSummer",
      title: "Price Summer",
      type: "string",
    },
    {
      name: "availability",
      title: "Availability",
      type: "object",
      fields: [
        {
          name: "years",
          title: "Years",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                { name: "year", title: "Year", type: "string" },
                { name: "semesters", title: "Semesters", type: "array", of: [{ type: "string" }] }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "services",
      title: "Services",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "grid",
      }
    }
  ]
};
