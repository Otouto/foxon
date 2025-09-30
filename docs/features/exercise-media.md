# Exercise Media Upload

This document combines information about the exercise media upload feature implementation.

## Quick Reference

- **Upload Types**: Images (JPG, PNG, GIF, WebP) + Videos (MP4, MOV, WebM)
- **Size Limits**: Images 10MB, Videos 50MB
- **Field Mapping**: Description → Instructions field in database
- **Storage**: Cloudinary CDN
- **UX**: Native file picker (instant, no intermediate UI)

## Setup

See [Cloudinary Setup Guide](../setup/cloudinary.md)

## Video Support

See [Video Support Documentation](./video-support.md)

## Implementation Details

### Components
- `ImageUploadField.tsx` - Upload component with validation
- `WorkoutExerciseCard.tsx` - Display in workout creation
- `workout/[id]/page.tsx` - Display in workout detail

### Key Features
- Client-side validation (format, size)
- Direct Cloudinary API upload
- Video detection and playback
- Image optimization via CldImage
- Mobile-friendly (camera support)

### Database
- Field: `Exercise.imageUrl` (stores Cloudinary URL)
- Field: `Exercise.instructions` (text instructions)

## User Flow

1. Create exercise → Click upload area
2. Native file picker opens instantly
3. Select image/video
4. Upload with progress indicator
5. Preview with controls (videos) or thumbnail (images)
6. Save exercise
7. Media displays in workout templates

---

For implementation notes, see original files in project root (if kept) or git history.
