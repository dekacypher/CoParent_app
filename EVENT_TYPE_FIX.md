# Event Type Constraint Fix

## Problem
The error: `new row for relation "events" violates check constraint "events_type_check"`

This happens because the app was sending `type: "activity"` but the Supabase table only accepts certain values (like `custody`, `school`, etc.).

## What Was Fixed

### 1. ActivitiesPage.tsx
- Added type mapping to convert activity types to valid event types:
  - `activity` → `custody`
  - `city-event` → `custody`
  - `Outdoor` → `custody`
  - `Educational` → `school`
  - `Sports` → `custody`
  - `Arts & Crafts` → `custody`
  - `Entertainment` → `custody`

### 2. ActivitySuggestions.tsx
- Changed from `type: "activity"` to `type: "custody"`
- Updated to use Supabase instead of API

### 3. supabase.ts
- Updated `createEvent` to also populate the `date` column (for backwards compatibility)

## How to Deploy

Since Netlify CLI is having issues, you have two options:

### Option A: Manual Deploy
1. Open terminal in project directory
2. Run: `npm run build`
3. Go to https://app.netlify.com/projects/coparent-app/deploys
4. Click "Trigger deploy" → "Deploy site"

### Option B: Git Deploy
1. Commit and push changes to GitHub
2. Netlify will auto-deploy

## Test After Deployment

1. Go to https://coparent-app.netlify.app/activities
2. Click "Add to Plan" on any activity
3. Fill in date and time
4. Click "Add to Calendar"

**Should work now!** The `type` will be `custody` which satisfies the constraint.
