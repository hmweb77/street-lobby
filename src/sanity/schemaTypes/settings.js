// /schemas/settings.js

export default {
    name: 'settings',
    type: 'document',
    title: 'Color Settings',
    fields: [
      {
        name: 'titleAccentColor',
        type: 'string',
        title: 'Title Accent Color',
        description: 'Hex color for the green title shadow (e.g., #32F232)',
        initialValue: '#32F232',
        validation: Rule => Rule.regex(/^#([0-9A-F]{3}){1,2}$/i).error('Must be a valid hex color'),
      },
    ],
  }
  