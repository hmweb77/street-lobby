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
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image" }],
      options: { layout: "grid" },
      validation: (Rule) => Rule.max(20),
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
      title: "Price (Winter) Per Month",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    },
    {
      name: "priceSummer",
      title: "Price ( July/August ) per month",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    },
    {
      name: "availableSemesters",
      title: "Available Periods",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "semester",
              title: "Period",
              type: "string",
              options: {
                list: ["1st Semester", "2nd Semester", "July", "August"],
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
          ],
          preview: {
            select: {
              semester: "semester",
              year: "year",
            },
            prepare({ semester, year }) {
              return {
                title: `${semester} - ${year}`,
                subtitle: year,
              };
            },
          },
        },
      ],
      initialValue: Array.from({ length: 3 }, (_, i) => {
        const currentYear = `${new Date().getFullYear() + i - 1}/${new Date().getFullYear() + i}`;
        return [
          { semester: "1st Semester", year: currentYear },
          { semester: "2nd Semester", year: currentYear },
          { semester: "July", year: currentYear },
          { semester: "August", year: currentYear },
        ];
      }).reduce((acc, val) => acc.concat(val), []),
    },
    {
      name: "bookedPeriods",
      title: "Booked Periods",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "semester",
              title: "Period",
              type: "string",
              options: {
                list: ["1st Semester", "2nd Semester", "July", "August"],
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
          preview: {
            select: {
              semester: "semester",
              year: "year",
            },
            prepare({ semester, year }) {
              return {
                title: `${semester} - ${year}`,
                subtitle: year,
              };
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.custom((bookedPeriods) => {
          if (!bookedPeriods) return true;

          const errors = [];
          const yearMap = new Map();

          bookedPeriods.forEach((period, index) => {
            const { semester, year } = period;
            if (!yearMap.has(year)) {
              yearMap.set(year, {
                fullYear: false,
                bothSemesters: false,
                semesters: new Set(),
              });
            }
            const yearData = yearMap.get(year);

            if (semester === "Full Year") {
              if (yearData.fullYear) {
                errors.push(
                  `Already has booked "Full Year" for ${year}. Cannot book "Full Year" twice in ${year}.`
                );
              }
              yearData.fullYear = true;
            } else if (semester === "Both Semesters") {
              if (yearData.bothSemesters) {
                errors.push(
                  `Already has booked "Both Semesters" for ${year}. Cannot book "Both Semesters" twice in ${year}.`
                );
              }
              yearData.bothSemesters = true;
            } else {
              if (yearData.semesters.has(semester)) {
                errors.push(
                  `Already has booked "${semester}" for ${year}. Cannot book "${semester}" twice in ${year}.`
                );
              }
              yearData.semesters.add(semester);
            }
          });

          bookedPeriods.forEach((period, index) => {
            const { semester, year } = period;
            const yearData = yearMap.get(year);

            if (semester === "Full Year") {
              if (yearData.bothSemesters || yearData.semesters.size > 0) {
                errors.push(
                  `Already has other periods booked for ${year}. "Full Year" cannot be booked with other periods in ${year}.`
                );
              }
            } else {
              if (yearData.fullYear) {
                errors.push(
                  `Already has booked "Full Year" in ${year}. "${semester}" cannot be booked with "Full Year" in ${year}.`
                );
              }
            }

            if (semester === "Both Semesters") {
              const hasIndividual = ["1st Semester", "2nd Semester"].some((s) =>
                yearData.semesters.has(s)
              );
              if (hasIndividual) {
                errors.push(
                  `Already has booked semester periods in ${year}. "Both Semesters" cannot be booked with individual semesters in ${year}.`
                );
              }
            } else if (["1st Semester", "2nd Semester"].includes(semester)) {
              if (yearData.bothSemesters) {
                errors.push(
                  `Already has Both Semesters booked in ${year}. "${semester}" cannot be booked with "Both Semesters" in ${year}.`
                );
              }
            }
          });

          return errors.length > 0 ? errors.join(" ") : true;
        }),
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
      _id: "_id",
    },
    prepare({ title, roomNumber, isAvailable, _id }) {
      const isDraft = _id.startsWith("drafts");
      return {
        title: `${title} (Room ${roomNumber})`,
        // subtitle: isDraft ? "Draft" : isAvailable ? "Available" : "Unavailable",
      };
    },
  },
};
