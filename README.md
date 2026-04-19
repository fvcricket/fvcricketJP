# Cricket Scorecard App

A mobile-first web application for managing cricket practice matches.

## Features

- Dynamic fixture creation
- Dynamic player addition during scoring
- Handover to another scorer with match code
- Guest user support
- Registered users can edit scorecards
- Real-time scoring with Supabase
- Archiving to Turso DB when match ends
- Professional UI with Tailwind CSS
- Sponsored by NC Bulls Cricket Club

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase for real-time backend
- Turso DB for archiving
- React Router for navigation
- Deployed on GitHub Pages

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` (Supabase and Turso credentials are already configured)
4. Run development server: `npm run dev`
5. Build for production: `npm run build`
6. Deploy to GitHub Pages: `npm run deploy`

## Database Setup

### Supabase

1. Create a new project at https://supabase.com
2. Go to SQL Editor and run the schema from `src/database/supabase-schema.sql`
3. Update the `.env` file with your Supabase URL and anon key
4. Enable authentication in Supabase dashboard

### Turso

1. Create a database at https://turso.tech
2. Run the schema from `src/database/turso-schema.sql` in your Turso database
3. Update the `.env` file with your Turso URL and auth token

## Usage

- Create fixtures dynamically
- Start matches and add players on the fly
- Score runs with options: 0,1,2,3,4,6, wide+, noball+
- Handover scoring to another user with a unique match code
- Guests can view matches with the code
- Only logged-in users can edit scorecards
- Matches are archived to Turso when completed

## Contributing

This app is designed for mobile users, with a focus on professional UX.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
