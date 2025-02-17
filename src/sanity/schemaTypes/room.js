export const roomSchema = {
  name: "room",
  title: "Room",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 200,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "property",
      title: "Property",
      type: "reference",
      to: [{ type: "property" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "roomNumber",
      title: "Room Number",
      type: "number",
      validation: (Rule) => Rule.required().positive().integer(),
    },
    {
      name: "roomType",
      title: "Room Type",
      type: "string",
      options: {
        list: ["Single bed", "Double bed", "Twin beds", "Suite", "Any"],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "priceWinter",
      title: "Price (Winter)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    },
    {
      name: "priceSummer",
      title: "Price (Summer)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    },
    {
      name: "availableSemesters",
      title: "Available Semesters",
      type: "array",
      of: [{ type: "object", fields: [
        {
          name: "semester",
          title: "Semester",
          type: "string",
          options: {
            list: ["1st Semester", "2nd Semester", "Summer", "Both Semesters", "Full Year"],
          },
        },
        {
          name: "year",
          title: "Year",
          type: "number",
          options: {
            list: Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i),
          },
        },
      ]}],
      initialValue: Array.from({ length: 3 }, (_, i) => {
        const currentYear = new Date().getFullYear() + i;
        return [
          { semester: "1st Semester", year: currentYear },
          { semester: "2nd Semester", year: currentYear },
          { semester: "Summer", year: currentYear },
          { semester: "Both Semesters", year: currentYear },
          { semester: "Full Year", year: currentYear }
        ];
      }).flat(),
    },
    
    {
      name: "bookedPeriods",
      title: "Booked Periods",
      type: "array",
      of: [{ type: "object", fields: [
        {
          name: "semester",
          title: "Semester",
          type: "string",
          options: {
            list: ["1st Semester", "2nd Semester", "Summer", "Both Semesters", "Full Year"],
          },
        },
        {
          name: "year",
          title: "Year",
          type: "number",
          options: {
            list: Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i),
          },
        },
      ]}],
    },
    {
      name: "isAvailable",
      title: "Is Available?",
      type: "boolean",
      initialValue: true,
      readOnly: true,
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
  preview: {
    select: {
      title: "title",
      roomNumber: "roomNumber",
      isAvailable: "isAvailable",
    },
    prepare({ title, roomNumber, isAvailable }) {
      return {
        title: `${title} (Room ${roomNumber})`,
        subtitle: isAvailable ? "Available" : "Unavailable",
      };
    },
  },
};

