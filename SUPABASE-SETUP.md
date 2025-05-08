# Clos8 Style Sense AI - Supabase Setup Guide

This guide walks you through setting up Supabase as the backend for the Clos8 Style Sense AI application.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. Your application code with the Supabase integration

## Step 1: Create a New Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in
2. Click "New Project" and fill in the required information
3. Choose a name for your project (e.g., "clos8-style-sense")
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create New Project"

## Step 2: Get Your Supabase API Keys

1. In your Supabase dashboard, go to Project Settings > API
2. Copy the "URL" and "anon/public" key
3. Add these to your `.env` file in your project root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Create Storage Bucket

1. In your Supabase dashboard, go to Storage
2. Click "Create a new bucket"
3. Name the bucket "images" (this must match the name used in the code)
4. Make sure "Public bucket" is checked to allow public access to images
5. Click "Create bucket"

## Step 4: Run the SQL Setup Script

1. In your Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy and paste the entire contents of the `supabase-setup.sql` file from this repository
4. Run the script

This script will:
- Create the necessary tables for clothing items and outfits
- Set up proper relationships between tables
- Configure Row Level Security (RLS) policies
- Set up appropriate indexes for query performance

## Step 5: Enable Email Authentication

1. In your Supabase dashboard, go to Authentication > Providers
2. Ensure Email provider is enabled
3. Configure settings as needed (confirmation emails, etc.)
4. Optional: Set up additional authentication providers

## Step 6: Storage Bucket Configuration

After creating the storage bucket, you need to set up appropriate permissions:

1. In your Supabase dashboard, go to Storage > Policies
2. Click on your "images" bucket
3. Add the following policies:

For INSERT operations:
- Policy name: "Allow authenticated users to upload files"
- Policy definition: `(auth.role() = 'authenticated')`

For SELECT operations:
- Policy name: "Allow public access to files"
- Policy definition: `(true)` (This allows anyone to view the images)

## Step 7: Testing Your Setup

1. Run your application with the Supabase environment variables set
2. Try to register a new user
3. Add some clothing items to your wardrobe
4. Generate outfits to ensure the Supabase integration is working properly

## Database Schema

### clothing_items Table
- id: UUID (primary key)
- name: TEXT (optional)
- imageUrl: TEXT
- type: TEXT (enum: 'upper' | 'bottom')
- categoryId: TEXT
- subcategoryId: TEXT
- color: TEXT
- createdAt: TIMESTAMP WITH TIME ZONE
- user_id: UUID (references auth.users)

### outfits Table
- id: UUID (primary key)
- upper: JSONB (JSON object representing upper clothing item)
- bottom: JSONB (JSON object representing bottom clothing item)
- day: TEXT (enum: days of the week)
- createdAt: TIMESTAMP WITH TIME ZONE
- user_id: UUID (references auth.users)

## Troubleshooting

### Images Not Loading
- Check that the storage bucket permissions are properly set to public
- Verify that image URLs are correctly formatted with the Supabase storage URL

### Authentication Issues
- Ensure your Supabase URL and anon key are correctly set in your environment variables
- Check Supabase authentication logs for specific errors

### Database Query Errors
- Verify that the tables were created correctly with the SQL script
- Check the Row Level Security policies are in place
- Review the Supabase database logs for specific errors

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript/introduction)
- [Supabase Auth Documentation](https://supabase.io/docs/guides/auth)
- [Supabase Storage Documentation](https://supabase.io/docs/guides/storage)
