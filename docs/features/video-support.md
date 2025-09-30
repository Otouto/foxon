# Video Support for Exercise Demonstrations

## Overview

Foxon now supports **video uploads** in addition to images and GIFs for exercise demonstrations. This provides a better way to show proper exercise form, especially for complex movements.

## Supported Formats

### Images
- **Formats**: JPG, JPEG, PNG, GIF, WebP
- **Max Size**: 10MB
- **Use case**: Static form photos, simple movements

### Videos ✨ NEW
- **Formats**: MP4, MOV, WebM
- **Max Size**: 50MB
- **Use case**: Dynamic demonstrations, complex movements, form guides

## Why Videos Over GIFs?

| Feature | GIF | Video (MP4) |
|---------|-----|-------------|
| File Size | 2-5MB for 5 seconds | 200-500KB for 5 seconds |
| Quality | Lower (256 colors) | High (millions of colors) |
| Mobile Battery | High drain | Optimized |
| Autoplay | Always | Can be controlled |
| Cloudinary Optimization | Limited | Automatic transcoding |

**Result**: Videos are 5-10x smaller than GIFs with better quality! 🎉

## How It Works

### Upload Process

1. **User selects video** from device (MP4, MOV, or WebM)
2. **Client-side validation**: Format and size check (max 50MB)
3. **Upload to Cloudinary**: Direct upload via `/video/upload` endpoint
4. **Cloudinary processing**:
   - Transcodes to optimized formats (H.264, H.265)
   - Creates multiple quality versions
   - Generates thumbnail
   - CDN distribution
5. **URL stored in database**: `https://res.cloudinary.com/.../video/upload/...`

### Display

Videos are automatically detected by URL pattern and displayed with:
- **Controls**: Play, pause, volume, fullscreen
- **Loop**: Auto-replays for continuous demonstration
- **Muted by default**: Better UX (auto-play without sound)
- **Inline playback**: No fullscreen popup on mobile

## Technical Implementation

### Components Updated

#### `ImageUploadField.tsx`
- Added video format validation
- Separate size limits (10MB images, 50MB videos)
- Uses `/video/upload` endpoint for videos
- Video preview with HTML5 `<video>` element

#### `WorkoutExerciseCard.tsx`
- Detects video vs image via `isVideoUrl()` helper
- Renders `<video>` tag for videos, `CldImage` for images

#### `workout/[id]/page.tsx`
- Same video detection and rendering logic
- Consistent experience across app

### Helper Functions

**`src/lib/utils/mediaUtils.ts`**
```typescript
// Check if URL is a video
export const isVideoUrl = (url: string): boolean => {
  return url.includes('/video/upload/') || url.match(/\.(mp4|mov|webm)$/i) !== null;
};
```

## Size Limits Explained

### Why 50MB for Videos?

**Short exercise demos** (5-15 seconds) typically:
- **4K video**: 15-30MB
- **1080p video**: 5-15MB
- **720p video**: 2-8MB

50MB allows high-quality 1080p videos up to 30 seconds, which is perfect for exercise demonstrations.

### Cloudinary Optimization

Even if you upload a 40MB video, Cloudinary:
1. Transcodes to efficient codecs (H.264/H.265)
2. Creates adaptive bitrate versions
3. Serves optimized version based on device/connection
4. **End result**: Mobile users might download 2-5MB, not 40MB!

## Best Practices

### For Content Creators

1. **Keep videos short**: 5-15 seconds ideal
2. **Focus on form**: Show 2-3 repetitions clearly
3. **Good lighting**: Ensure form is visible
4. **Stable camera**: Use tripod or stable surface
5. **Vertical or square**: Better for mobile app

### Recommended Specs

- **Resolution**: 1080p (1920x1080) or 720p (1280x720)
- **Frame rate**: 30fps (smooth) or 60fps (very smooth)
- **Duration**: 5-15 seconds
- **Orientation**: Vertical (9:16) or Square (1:1) preferred

### File Size Tips

**Before uploading**, you can reduce size:
- Use 720p instead of 4K (often looks identical on phones)
- Use 30fps instead of 60fps (usually sufficient)
- Trim to essential seconds only
- Use built-in phone camera compression

## Mobile Considerations

### Why `playsInline` and `muted`?

- **`playsInline`**: Prevents fullscreen takeover on iOS
- **`muted`**: Allows autoplay (browsers block autoplaying videos with sound)
- **`loop`**: Continuous demonstration without user interaction
- **`controls`**: Users can pause, adjust volume, go fullscreen if needed

### Data Usage

Videos are served via Cloudinary CDN with:
- Adaptive bitrate streaming
- Format detection (WebM for Chrome, H.265 for iOS)
- Efficient caching

**Typical data usage** for 10-second exercise video:
- High-speed WiFi: 2-3MB
- 4G/5G: 1-2MB (lower quality automatically served)
- Slow connection: 500KB-1MB (even lower quality)

## Cloudinary Configuration

### Upload Preset Settings

Your `foxon_exercises` preset should support both images and videos:

```
Resource Types: image, video
Allowed Formats: jpg, jpeg, png, gif, webp, mp4, mov, webm
Max File Size: 50MB (videos), 10MB (images)
```

### Video Transformations (Optional)

You can add auto-transformations in Cloudinary:
- **Quality**: `q_auto` (automatic quality optimization)
- **Format**: `f_auto` (automatic format selection)
- **Width**: `w_800,c_limit` (max width 800px, maintains aspect ratio)

## Testing

### Test Video Upload

1. Go to workout creation → Add Exercise → Create new
2. Click upload area
3. Select a video file (MP4, MOV, or WebM)
4. Watch upload progress
5. See video preview with controls
6. Create exercise
7. View in workout template → video should play

### Test Cases

- ✅ Upload MP4 (most common)
- ✅ Upload MOV (iPhone default)
- ✅ Upload WebM (Android some apps)
- ✅ Upload video > 50MB (should show error)
- ✅ Upload unsupported format (should show error)
- ✅ Video displays in workout creation
- ✅ Video displays in workout detail page
- ✅ Video controls work (play, pause, volume)
- ✅ Video loops automatically

## Troubleshooting

### "Video too large" Error
- **Max size**: 50MB
- **Solution**: Trim video or reduce quality before upload
- **Tools**: iPhone Photos app, Google Photos, or online compressors

### Video Upload Fails
- Check Cloudinary upload preset allows `resource_type: video`
- Verify file format is MP4, MOV, or WebM
- Check file size is under 50MB
- Check browser console for specific error

### Video Doesn't Play
- Verify URL includes `/video/upload/`
- Check video format is supported by browser
- Try different browser (Chrome, Safari, Firefox)
- Check browser console for codec errors

### Video Quality Poor
- Upload higher resolution source (1080p recommended)
- Check Cloudinary transformations aren't over-compressing
- Verify good lighting in source video

## Future Enhancements

Potential improvements for later:

1. **Video trimming**: Trim videos within the app before upload
2. **Slow motion**: Cloudinary can slow down videos programmatically
3. **Thumbnail selection**: Choose custom thumbnail frame
4. **Multiple angles**: Upload multiple videos per exercise
5. **Form annotations**: Draw on video to highlight proper form
6. **GIF conversion**: Auto-convert GIFs to videos for size savings

## Cost Impact

### Cloudinary Free Tier

**Before video support**:
- Image uploads: ~5MB/exercise
- 25GB storage = ~5,000 exercises

**With video support**:
- Video uploads: ~5-15MB/exercise (after Cloudinary compression)
- 25GB storage = ~2,500 exercises (conservative estimate)

**Bandwidth**: 25GB/month is typically sufficient for moderate use

### Recommendation

Start with videos, monitor usage. If you approach limits:
1. Upgrade Cloudinary ($99/month includes 75GB storage + 75GB bandwidth)
2. Or limit video uploads to premium exercises only
3. Or encourage users to use shorter videos

---

**Status**: ✅ Video support fully implemented and ready for testing!

**Next**: Upload a test video and see it in action! 🎥