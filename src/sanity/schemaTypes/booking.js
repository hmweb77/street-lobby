export const bookingSchema = {
  name: "booking",
  title: "Booking",
  type: "document",
  fields: [
    {
      name: "bookedPeriod",
      title: "Booked Period",
      readOnly: true,
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "user",
              title: "User",
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
              name: "price",
              title: "Price",
              type: "number",
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
          ],
          preview: {
            select: {
              roomTitle: "room.title",
              semester: "semester",
              year: "year",
            },
            prepare({ roomTitle, semester, year }) {
              return {
                title: `${roomTitle} - ${semester} ${year}`,
              };
            },
          },
          validation: (Rule) =>
            Rule.required().error("Each booked period must have data."),
        },
      ],
      validation: (Rule) =>
        Rule.custom((bookedPeriods) => {
          if (!bookedPeriods) return true;

          const errors = [];
          const conflictMap = new Map(); // Tracks room/year combinations

          bookedPeriods.forEach((period, index) => {
            const { room, semester, year } = period;
            if (!room) return true;

            const roomYearKey = `${room._ref}-${year}`;

            if (!conflictMap.has(roomYearKey)) {
              conflictMap.set(roomYearKey, {
                fullYear: false,
                bothSemesters: false,
                semesters: new Set(),
              });
            }
            const roomYearData = conflictMap.get(roomYearKey);

            // Handle conflicts per room/year
            if (semester === "Full Year") {
              if (roomYearData.fullYear) {
                errors.push(
                  `Room ${room._ref} already has "Full Year" booked for ${year}`
                );
              }
              roomYearData.fullYear = true;
            } else if (semester === "Both Semesters") {
              if (roomYearData.bothSemesters) {
                errors.push(
                  `Room ${room._ref} already has "Both Semesters" booked for ${year}`
                );
              }
              roomYearData.bothSemesters = true;
            } else {
              if (roomYearData.semesters.has(semester)) {
                errors.push(
                  `Room ${room._ref} already has "${semester}" booked for ${year}`
                );
              }
              roomYearData.semesters.add(semester);
            }

            // Check for incompatible combinations
            if (semester === "Full Year") {
              if (
                roomYearData.bothSemesters ||
                roomYearData.semesters.size > 0
              ) {
                errors.push(
                  `Room ${room._ref} has conflicting bookings for ${year} - Full Year cannot coexist with other semesters`
                );
              }
            } else if (semester === "Both Semesters") {
              if (
                ["1st Semester", "2nd Semester"].some((s) =>
                  roomYearData.semesters.has(s)
                )
              ) {
                errors.push(
                  `Room ${room._ref} has conflicting bookings for ${year} - Both Semesters cannot coexist with individual semesters`
                );
              }
            } else if (["1st Semester", "2nd Semester"].includes(semester)) {
              if (roomYearData.bothSemesters) {
                errors.push(
                  `Room ${room._ref} has conflicting bookings for ${year} - Individual semesters cannot coexist with Both Semesters`
                );
              }
            }
          });

          return errors.length > 0 ? errors.join(" \n") : true;
        }),
    },
    {
      name: "bookingDate",
      title: "Booking Date",
      type: "datetime",
      readOnly: true,
      initialValue: new Date().toISOString(),
    },
    {
      name : "tracker",
      title: "tracker",
      hidden: true,
      type: "text"
    },
    {
      name: "status",
      title: "Status (admin only & Can't be changed after cancellations)",
      type: "string",
      options: {
        list: ["pending", "confirmed", "cancelled"],
        layout: "dropdown",
      },
      
      readOnly: ({ document , currentUser  }) =>
        document?.cancellationKey?.startsWith("cancelled+") || !currentUser?.roles.some(role => role.name === 'administrator'),
      initialValue: "pending",
    },
    {
      name: "cancellationKey",
      title: "Cancellation Key",
      type: "string",
      hidden: true, // Hide this field from editors
    },
    {
      name: "totalPrice",
      title: "Total Price",
      type: "number",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    },
    {
      name: "paymentMethod",
      title: "Payment Method",
      type: "string",
      options: {
        list: ["Credit Card", "PayPal", "Bank Transfer", "Cash"],
      },
    },
    {
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      options: {
        list: ["pending", "paid", "failed", "refunded"],
        layout: "dropdown",
      },
      initialValue: "pending",
    },

    {
      name: "notes",
      title: "Notes",
      type: "text",
    },
  ],
  preview: {
    select: {
      userName: "bookedPeriod.0.user.name",
      email: "bookedPeriod.0.user.email",
      roomTitle: "bookedPeriod.0.room.title",
      bookingDate: "bookingDate",
      status: "status",
      total: "totalPrice",
      paymentStatus: "paymentStatus",
    },
    prepare(selection) {
      const {
        userName,
        email,
        roomTitle,
        bookingDate,
        status,
        total,
        paymentStatus,
      } = selection;
      const date = bookingDate
        ? new Date(bookingDate).toLocaleDateString()
        : "No date";

      return {
        title: `${userName || "Unknown user"} | ${roomTitle || "No room"} | ${status}`,
        subtitle: [
          email && `Email: ${email}`,
          date && `Booked: ${date}`,
          total !== undefined && `Total: $${total}`,
          paymentStatus && `Payment: ${paymentStatus}`,
        ]
          .filter(Boolean)
          .join(" | "),
      };
    },
  },
};
