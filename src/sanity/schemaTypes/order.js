export const orderSchema = {
    name: "order",
    title: "Order",
    type: "document",
    fields: [
      {
        name: "user",
        title: "User",
        type: "reference",
        to: [{ type: "user" }],
        validation: (Rule) => Rule.required(),
      },
      {
        name: "userEmail",
        title: "User Email",
        type: "string",
        validation: (Rule) => Rule.required().email(),
      },
      {
        name: "bookings",
        title: "Bookings",
        type: "array",
        of: [{ type: "reference", to: [{ type: "booking" }] }],
        validation: (Rule) =>
          Rule.required().min(1).error("At least one booking is required."),
      },
      {
        name: "orderStatus",
        title: "Order Status",
        type: "string",
        options: {
          list: ["pending", "canceled", "confirmed"],
          layout: "dropdown",
        },
        validation: (Rule) => Rule.required(),
        initialValue: "pending",
      },
      {
        name: "totalAmount",
        title: "Total Amount",
        type: "number",
        readOnly: true,
        validation: (Rule) => Rule.required().min(0),
      },
      {
        name: "paymentMethod",
        title: "Payment Method",
        type: "string",
        options: {
          list: ["Credit Card", "PayPal", "Bank Transfer", "Cash"],
        },
        validation: (Rule) => Rule.required(),
      },
      {
        name: "paymentStatus",
        title: "Payment Status",
        type: "string",
        options: {
          list: ["pending", "paid", "failed", "refunded"],
          layout: "dropdown",
        },
        validation: (Rule) => Rule.required(),
        initialValue: "pending",
      },
      {
        name: "orderDate",
        title: "Order Date",
        type: "datetime",
        readOnly: true,
        initialValue: new Date().toISOString(),
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
        email: "userEmail",
        status: "orderStatus",
        total: "totalAmount",
        date: "orderDate",
      },
      prepare({ userName, email, status, total, date }) {
        return {
          title: `${userName} | ${status}`,
          subtitle: `${email} | Total: $${total} | ${new Date(date).toLocaleDateString()}`,
        };
      },
    },
  };
  