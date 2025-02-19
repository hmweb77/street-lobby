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
            },
            {
              name: "year",
              title: "Year",
              type: "string",
              options: {
                list: Array.from(
                  { length: 3 },
                  (_, i) => `${new Date().getFullYear() + i - 1}/${new Date().getFullYear() + i}`
                ),
              },
            },
          ],
        },
      ],
      initialValue: Array.from({ length: 3 }, (_, i) => {
        const currentYear = `${new Date().getFullYear() + i - 1}/${new Date().getFullYear() + i}`;
        return [
          { semester: "1st Semester", year: currentYear },
          { semester: "2nd Semester", year: currentYear },
          { semester: "Summer", year: currentYear },
          { semester: "Both Semesters", year: currentYear },
          { semester: "Full Year", year: currentYear },
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
            },
            {
              name: "year",
              title: "Year",
              type: "string",
              options: {
                list: Array.from(
                  { length: 3 },
                  (_, i) => `${new Date().getFullYear() + i - 1}/${new Date().getFullYear() + i}`
                ),
              },
            },
          ],
          
        },
      ],
      validation: (Rule) => Rule.custom((bookedPeriods) => {
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
              errors.push(`Duplicate "Full Year" for ${year} at position ${index + 1}.`);
            }
            yearData.fullYear = true;
          }
          // Handle "Both Semesters"
          else if (semester === "Both Semesters") {
            if (yearData.bothSemesters) {
              errors.push(`Duplicate "Both Semesters" for ${year} at position ${index + 1}.`);
            }
            yearData.bothSemesters = true;
          }
          // Handle "1st", "2nd", "Summer"
          else {
            if (yearData.semesters.has(semester)) {
              errors.push(`Duplicate "${semester}" for ${year} at position ${index + 1}.`);
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
              errors.push(`"Full Year" cannot coexist with other semesters in ${year} (position ${index + 1}).`);
            }
          } else {
            if (yearData.fullYear) {
              errors.push(`"${semester}" cannot coexist with "Full Year" in ${year} (position ${index + 1}).`);
            }
          }
    
          // Conflict 2: "Both Semesters" vs. "1st" or "2nd"
          if (semester === "Both Semesters") {
            const hasIndividual = ["1st Semester", "2nd Semester"].some(s => yearData.semesters.has(s));
            if (hasIndividual) {
              errors.push(`"Both Semesters" cannot coexist with "1st/2nd Semester" in ${year} (position ${index + 1}).`);
            }
          } else if (["1st Semester", "2nd Semester"].includes(semester)) {
            if (yearData.bothSemesters) {
              errors.push(`"${semester}" cannot coexist with "Both Semesters" in ${year} (position ${index + 1}).`);
            }
          }
        });
    
        return errors.length > 0 ? errors.join(" ") : true;
      }),
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
