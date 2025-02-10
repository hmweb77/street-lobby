export const roomSchema = {
  name: "room",
  title: "Room",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
     
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
    
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
      type: "number",
    },
    {
      name: "priceSummer",
      title: "Price Summer",
      type: "number",
    },
    {
      name: "availableSemesters",
      title: "Available Semesters",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: ["1st Semester", "2nd Semester", "Summer", "Both Semesters", "Full Year"],
      },
    },
    {
      name: "bookedPeriods",
      title: "Booked Periods",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: ["1st Semester", "2nd Semester", "Summer", "Both Semesters", "Full Year"],
      },
    },
    {
      name: "isAvailable",
      title: "Is Available?",
      type: "boolean",
      default: true,
    },
    {
      name: "services",
      title: "Services",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "grid",
      },
    },
  ],
};
