# Clos8 Style Sense AI

An AI-powered wardrobe management and outfit recommendation application.

## Features

- Digital wardrobe management
- AI-powered outfit recommendations using Google's Gemini API
- Weekly outfit planning
- User authentication and data persistence with Supabase

## Project info

## Supabase Integration

This project uses Supabase for:

- User authentication
- Database storage (clothing items and outfits)
- Image storage (clothing images)

To set up Supabase for this project, see the [Supabase Setup Guide](./SUPABASE-SETUP.md).

## Local Development

If you want to work locally using your own IDE, you can clone this repo and push changes:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Create a .env file with your Supabase credentials
# (See the Supabase Setup Guide for details)

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Google Gemini API
- Supabase (Auth, Database, Storage)

## Deployment

To deploy, use your preferred hosting provider.

## Custom Domain

To connect a domain, follow your hosting provider's instructions.
