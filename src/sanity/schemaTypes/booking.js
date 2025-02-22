import { validation } from "sanity";

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
      name: "user",
      title: "User",
      type: "reference",
      to: [{ type: "user" }],
      validation: (Rule) => Rule.required(),
    },

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
              name: "price",
              title: "Price",
              type: "number",
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
          preview: {
            select: {
              semester: "semester",
              year: "year",
            },
            prepare({ semester, year }) {
              return {
                title: `${semester} - ${year}`,
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
          const yearMap = new Map(); // Tracks semesters per year

          // First Pass: Populate yearMap and check duplicates
          bookedPeriods.forEach((period, index) => {
            const { semester, year } = period;
            if (!yearMap.has(year)) {
              yearMap.set(year, {
                fullYear: false,
                bothSemesters: false,
                semesters: new Set(), // Tracks "1st", "2nd", "Summer"
              });
            }
            const yearData = yearMap.get(year);

            // Handle "Full Year"
            if (semester === "Full Year") {
              if (yearData.fullYear) {
                errors.push(
                  `Already has booked "Full Year" for ${year}. Cannot book "Full Year" twice in ${year}.`
                );
              }
              yearData.fullYear = true;
            }
            // Handle "Both Semesters"
            else if (semester === "Both Semesters") {
              if (yearData.bothSemesters) {
                errors.push(
                  `Already has booked "Both Semesters" for ${year}. Cannot book "Both Semesters" twice in ${year}.`
                );
              }
              yearData.bothSemesters = true;
            }
            // Handle "1st", "2nd", "Summer"
            else {
              if (yearData.semesters.has(semester)) {
                errors.push(
                  `Already has booked "${semester}" for ${year}. Cannot book "${semester}" twice in ${year}.`
                );
              }
              yearData.semesters.add(semester);
            }
          });

          // Second Pass: Check all conflicts
          bookedPeriods.forEach((period, index) => {
            const { semester, year } = period;
            const yearData = yearMap.get(year);

            // Conflict 1: "Full Year" vs. any other entry
            if (semester === "Full Year") {
              if (yearData.bothSemesters || yearData.semesters.size > 0) {
                errors.push(
                  `"Already has "Both Semesters" or "1st/2nd Semester" or "Summer" for ${year}. "Full Year" cannot booked with other semesters or "Both Semesters" or "1st/2nd Semester" or "Summer" in ${year}.`
                );
              }
            } else {
              if (yearData.fullYear) {
                errors.push(
                  `Already has booked "Full Year" in ${year}. "${semester}" cannot book with "Full Year" in ${year}.`
                );
              }
            }

            // Conflict 2: "Both Semesters" vs. "1st" or "2nd"
            if (semester === "Both Semesters") {
              const hasIndividual = ["1st Semester", "2nd Semester"].some((s) =>
                yearData.semesters.has(s)
              );
              if (hasIndividual) {
                errors.push(
                  `Already has booked "1st/2nd Semester" in ${year}. "Both Semesters" cannot book with "1st/2nd Semester" in ${year} .`
                );
              }
            } else if (["1st Semester", "2nd Semester"].includes(semester)) {
              if (yearData.bothSemesters) {
                errors.push(
                  ` Already has booked Both Semesters in ${year}. "${semester}" cannot book with "Both Semesters" in ${year}.`
                );
              }
            }
          });

          return errors.length > 0 ? errors.join(" ") : true;
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
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["pending", "confirmed", "cancelled"],
        layout: "dropdown",
      },
      readOnly: ({ value }) => value === "cancelled",
      initialValue: "pending",

      preview: {
        select: {
          status: "status",
        },
        prepare({ status }) {
          return {
            title: `Status: (Can't be changed) after cancellation`,
          };
        },
      },
      // validation: (Rule) =>
      //   Rule.custom((status) => {
      //     if ( status === "cancelled") {
      //       return "Status cannot be 'Changed'. after cancellation";
      //     }
      //     return true;
      //   }),
    },
    {
      name: "totalPrice",
      title: "Total Price",
      type: "number",
      readOnly: true,
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
      userName: "user.name",
      email: "user.email",
      room: "room.title",
      booking: "bookingDate",
      bookingStatus: "status",
      total: "totalPrice",
    },
    prepare({ userName, email, room, booking, bookingStatus, total }) {
      return {
        title: `${userName} | ${room} | ${bookingStatus}`,
        subtitle: `${email} |  ${total} | ${booking}  `,
      };
    },
  },
};
