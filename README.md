# Clos8 Style Sense AI

An AI-powered wardrobe management and outfit recommendation application.

## Features

- Digital wardrobe management
- AI-powered outfit recommendations using Google's Gemini API
- Weekly outfit planning
- User authentication and data persistence with Supabase

## Supabase Integration

This project uses Supabase for:

- User authentication
- Database storage (clothing items and outfits)
- Image storage (clothing images)

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

## Project Summary

Clos8 Style Sense AI is a modern web application that helps users manage their wardrobe and receive AI-powered outfit recommendations. The project includes:

- A digital wardrobe where users can add, categorize, and manage clothing items
- Integration with Google Gemini API for generating smart outfit suggestions
- Weekly outfit planning and scheduling
- User authentication and persistent data storage using Supabase
- A clean, responsive UI built with React, shadcn-ui, and Tailwind CSS

All code is TypeScript-based and leverages best practices for state management, error handling, and user experience.
