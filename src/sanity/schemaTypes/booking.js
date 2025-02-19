export const bookingSchema = {
  name: "booking",
  title: "Booking",
  type: "document",
  fields: [
    {
      name: "room",
      title: "Room",
      type: "reference",
      to: [{ type: "room" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "age",
      title: "Age",
      type: "number",
      validation: (Rule) => Rule.required().min(18).max(100),
    },
    {
      name: "genre",
      title: "Genre",
      type: "string",
      options: {
        list: ["Male", "Female", "Other"],
        layout: "dropdown",
      },
    },
    {
      name: "permanentAddress",
      title: "Permanent Address",
      type: "text",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "nationality",
      title: "Nationality",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "idNumber",
      title: "ID Number",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "currentProfession",
      title: "Current Profession",
      type: "text",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "currentLocation",
      title: "Current Location",
      type: "text",
    },
    {
      name: "bookedPeriod",
      title: "Booked Period",
      type: "object",
      fields: [
        {
          name: "semester",
          title: "Semester",
          type: "string",
          options: {
            list: [
              "1st Semester",
              "2nd Semester",
              "Summer",
              "Both Semesters",
              "Full Year",
            ],
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: "year",
          title: "Year",
          type: "string",
          options: {
            list: Array.from(
              { length: 3 },
              (_, i) =>
                `${new Date().getFullYear() + i - 1}/${new Date().getFullYear() + i}`
            ),
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: "services",
          title: "Services",
          type: "string",
        },
      ],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "bookingDate",
      title: "Booking Date",
      type: "datetime",
      initialValue: (new Date()).toISOString(),
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["pending", "confirmed", "cancelled"],
        layout: "dropdown",
      },
      initialValue: "pending",
    },
  ],
  preview: {
    select: {
      title: "name",
      room: "room.title",
      period: "bookedPeriod",
      status: "status",
    },
    prepare({ title, room, period, status }) {
      return {
        title: `${title} - ${room}`,
        subtitle: `${period.semester} ${period.year} (${status})`,
      };
    },
  },
};