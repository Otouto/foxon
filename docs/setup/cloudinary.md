# Cloudinary Setup Guide

This guide will help you set up Cloudinary for exercise media uploads (images, GIFs, and videos) in Foxon.

**Note**: The app uses native file input with direct Cloudinary API upload (no widget UI). This provides an instant, clean file picker experience that matches your app's design.

**✨ NEW**: Video support added! Upload MP4, MOV, or WebM videos up to 50MB for better exercise demonstrations.

## Step 1: Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signing up, you'll be taken to the dashboard

## Step 2: Get Your Cloud Name

1. On the Cloudinary dashboard, find your **Cloud Name** at the top
2. Copy this value - you'll need it for the `.env` file

## Step 3: Create an Upload Preset

1. In the Cloudinary dashboard, go to **Settings** (gear icon in top right)
2. Click on the **Upload** tab in the left sidebar
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Configure the preset:
   - **Preset name**: `foxon_exercises`
   - **Signing Mode**: Select **Unsigned** (important!)
   - **Folder**: `foxon/exercises` (optional, helps organize uploads)
   - **Resource types**: Enable both `image` and `video` (important for video support!)
   - **Allowed formats**: jpg, jpeg, png, gif, webp, mp4, mov, webm
   - **Max file size**: 52428800 (50MB) for videos
   - **Transformation**: Add if you want to auto-resize (e.g., c_limit,w_1200,h_1200)
6. Click **Save**

## Step 4: Add Environment Variables

Add the following to your `.env` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name_here"
```

Replace `your_cloud_name_here` with your actual Cloudinary cloud name from Step 2.

**Note**: The `NEXT_PUBLIC_` prefix is required because this variable is used in client-side components.

## Step 5: Restart Your Dev Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## How It Works

- **Native file picker**: Click upload → system file browser opens instantly (no intermediate UI)
- **Direct API upload**: Files uploaded via FormData + fetch to Cloudinary API
- **Client-side validation**: Format and size checked before upload
- **Unsigned preset**: Allows uploads without authentication (safe for client-side use)
- **URL storage**: Only the Cloudinary URL is saved to your database
- **Free tier**: 25GB storage + 25GB bandwidth per month
- **Automatic optimization**: Cloudinary handles image compression and format conversion

## Security Notes

- The unsigned preset is safe for client-side use because:
  - It's limited to the formats and size we specify
  - It's scoped to a specific folder
  - It doesn't expose API secrets
- For production, you can add additional restrictions in Cloudinary settings

## Testing

To test the upload functionality:

1. Go to workout creation page
2. Click "Add Exercise"
3. Click "Create new exercise"
4. Click the "Upload image or GIF" field
5. **Your system file picker should open immediately** (no Cloudinary UI)
6. Select an image
7. Watch it upload with the clean loading state
8. Create the exercise
9. The image should display in workout templates and during sessions

## Troubleshooting

**"File picker not opening" or "Upload not working"**
- Verify `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly in `.env`
- Restart dev server after adding environment variable
- Check browser console for errors
- Ensure the upload preset is named exactly `foxon_exercises`
- Make sure the preset is set to **Unsigned** mode in Cloudinary dashboard

**"Upload fails" or error message displayed**
- Check file size (max 10MB) - error will show in UI
- Verify file format (JPG, PNG, GIF, WebP only) - error will show in UI
- Check browser console for Cloudinary API errors
- Verify upload preset exists and is configured correctly

**"Image not displaying after upload"**
- Verify the Cloudinary URL was saved to database
- Check browser console for CORS errors
- Ensure the image URL is publicly accessible
- Try refreshing the page