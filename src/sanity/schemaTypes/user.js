export const userSchema = {
  name: "user",
  title: "User",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: "phone",
      title: "Phone Number",
      type: "string",
    },
    {
      name: "age",
      title: "Age",
      type: "number",
      validation: (Rule) => Rule.required(),
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
      // validation: (Rule) => Rule.required(),
    },
    {
      name: "currentLocation",
      title: "Current Location",
      type: "text",
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["active", "inactive", "banned"],
        layout: "dropdown",
      },
      initialValue: "active",
    },
    {
      name: "notes",
      title: "Notes",
      type: "text",
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "email",
    },
  },
};
