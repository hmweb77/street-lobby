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
        name: "address",
        title: "Address",
        type: "string",
      },
      {
        name: "coordinates",
        title: "Coordinates",
        type: "geopoint",
      },
    ],
  };
  