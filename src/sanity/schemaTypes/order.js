export const orderSchema = {
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    {
      name: "orderBy",
      title: "Order By",
      type: "reference",
      to: [{ type: "user" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "bookings",
      title: "Bookings",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "booking" }],
        },
      ],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "notes",
      title: "Notes",
      type: "text",
    },
  ],
  preview: {
    select: {
      userName: "orderBy.name",
      bookingCount: "bookings.length",
    },
    prepare(selection) {
      const { userName, bookingCount, notes } = selection;
      return {
        title: `${userName || "Unknown user"} | ${bookingCount || 0} Bookings`,
      };
    },
  },
};