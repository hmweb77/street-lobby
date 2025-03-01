'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.jsx` route
 */

// import resolveDocumentActions from '@/sanity/lib/resolveDocumentActions'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from './src/sanity/env'
import { schema } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId: "pkg5i4cw",
  dataset: "production",
  schema,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: '2025-02-04' }),
  ],
  document: {
    actions: (prev, context) => {
      const isAdmin = context.currentUser?.roles.some(role => role.name === 'administrator');
  
      // If the user is an admin, return all actions
      if (isAdmin) return prev.filter(action => action.action !== 'duplicate');
  
      // Otherwise, remove "delete", "unpublish", and "duplicate"
      return context.schemaType === 'booking'
        ? prev.filter(action => !['delete', 'unpublish', 'duplicate'].includes(action.action))
        : prev;
    },
  }
  
})
