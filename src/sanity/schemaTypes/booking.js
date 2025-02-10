export const bookingSchema = {
    name: "booking",
    title: "Booking",
    type: "document",
    fields: [
    //   {
    //     name: "user",
    //     title: "User",
    //     type: "reference",
    //     to: [{ type: "user" }],
    //   },
      {
        name: "room",
        title: "Room",
        type: "reference",
        to: [{ type: "room" }],
      },
    
      {
        name: "semester",
        title: "Semester",
        type: "string",
        options: {
          list: ["1st Semester", "2nd Semester", "Summer", "Both Semesters", "Full Year"],
        },
      },
      {
        name: "status",
        title: "Booking Status",
        type: "string",
        options: {
          list: ["Pending", "Confirmed", "Cancelled"],
        },
      },
    ],
  };
  