// Each semester of property should have a single booking entry because of the unique constraint
export const bookingSchema = {
  name: "booking",
  title: "Booking",
  type: "document",
  fields: [
    {
      name: "roomTitle",
      title: "Room Title",
      type: "string",
    },
    {
      name: "bookedBy",
      title: "Booked By",
      type: "reference",
      to: [{ type: "user" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "bookedFor",
      title: "Booked For",
      type: "reference",
      to: [{ type: "user" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "room",
      title: "Room",
      type: "reference",
      to: [{ type: "room" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "semester",
      title: "Semester",
      type: "string",
      options: {
        list: ["1st Semester", "2nd Semester", "Summer"],
      },
      validation: (Rule) => Rule.required(),
    },

    {
      name: "year",
      title: "Year",
      type: "string",
      // options: {
      //   list: Array.from(
      //     { length: 3 },
      //     (_, i) =>
      //       `${new Date().getFullYear() + i - 1}/${new Date().getFullYear() + i}`
      //   ),
      // },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "services",
      title: "Services",
      type: "string",
    },

    {
      name: "price",
      title: "Price Monthly(Winter) / Total(summer)",
      type: "number",
      validation: (Rule) => Rule.required(),
    },

    {
      name: "bookingDate",
      title: "Booking Date",
      type: "datetime",
      readOnly: true,
      initialValue: new Date().toISOString(),
    },
    {
      name: "tracker",
      title: "tracker",
      hidden: true,
      type: "text",
    },

    {
      name: "cancellationKey",
      title: "Cancellation Key",
      type: "string",
      hidden: true, // Hide this field from editors
    },
    {
      name: "paymentMethod",
      title: "Payment Method",
      type: "string",
      options: {
        list: ["Stripe", "PayPal", "Bank Transfer", "Cash"],
      },
      readOnly: true,
    },

    {
      name: "status",
      title: "Status (admin only & Can't be changed after cancellations)",
      type: "string",
      options: {
        list: ["pending", "confirmed", "cancelled"],
        layout: "dropdown",
      },

      readOnly: ({ document, currentUser }) =>
        document?.cancellationKey?.startsWith("cancelled+") ||
        !currentUser?.roles.some((role) => role.name === "administrator"),
      initialValue: "pending",
    },

    {
      name: "firstSemesterPayments",
      title: "1st Semester Payments",
      type: "object",
      fields: [
        {
          name: "securityDeposit",
          title: "Security Deposit",
          type: "string",
          options: {
            list: ["paid", "unpaid"],
          },
          initialValue: "unpaid",
        },
        {
          name: "months",
          title: "Months",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "month",
                  title: "Month",
                  type: "string",
                  options: {
                    list: ["September", "October", "November", "December"],
                  },
                },
                {
                  name: "status",
                  title: "Status",
                  type: "string",
                  options: {
                    list: ["paid", "unpaid"],
                  },
                  initialValue: "unpaid",
                },
              ],
            },
          ],
        },
      ],
      hidden: ({ document }) => document?.semester !== "1st Semester",
    },
    {
      name: "secondSemesterPayments",
      title: "2nd Semester Payments",
      type: "object",
      fields: [
        {
          name: "securityDeposit",
          title: "Security Deposit",
          type: "string",
          options: {
            list: ["paid", "unpaid"],
          },
          initialValue: "unpaid",
        },
        {
          name: "months",
          title: "Months",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "month",
                  title: "Month",
                  type: "string",
                  options: {
                    list: ["February", "March", "April", "May"],
                  },
                },
                {
                  name: "status",
                  title: "Status",
                  type: "string",
                  options: {
                    list: ["paid", "unpaid"],
                  },
                  initialValue: "unpaid",
                },
              ],
            },
          ],
        },
      ],
      hidden: ({ document }) => document?.semester !== "2nd Semester",
    },
    {
      name: "summerPayment",
      title: "Summer Payment",
      type: "object",
      fields: [
        {
          name: "totalPayment",
          title: "Total Payment",
          type: "string",
          options: {
            list: ["paid", "unpaid"],
          },
          initialValue: "unpaid",
        },
      ],
      hidden: ({ document }) => document?.semester !== "Summer",
    },
    {
      name: "notes",
      title: "Notes",
      type: "text",
    },
  ],
  preview: {
    select: {
      userName: "bookedFor.name",
      email: "bookedFor.email",
      roomTitle: "room.title",
      bookingDate: "bookingDate",
      status: "status",
      semester: "semester",
      year: "year",
    },
    prepare(selection) {
      const {
        userName,
        email,
        roomTitle,
        bookingDate,
        status,
        semester,
        year,
      } = selection;
      const date = bookingDate
        ? new Date(bookingDate).toLocaleDateString()
        : "No date";

      return {
        title: `${userName || "Unknown user"} | ${roomTitle || "No room"} | ${status}`,
        subtitle: [
          semester && `Semester: ${semester}`,
          year && `Year: ${year}`,
          email && `Email: ${email}`,
          date && `Booked: ${date}`,
          status && `Status: ${status}`,
          userName && `Name: ${userName}`,
          roomTitle && `Room: ${roomTitle}`,
        ]
          .filter(Boolean)
          .join(" | "),
          description: [
            semester ,
            year,
            email,
            date,
            status ,
            userName,
            roomTitle,
          ].filter(Boolean).join(" | "),
      };
    },
  },
};
