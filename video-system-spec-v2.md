
# Video System for News Editor (Admin Panel) — Spec v2

## Goal
Implement a complete video system for the news editor in the admin panel.

Supported sources:
- YouTube
- VK Video
- Rutube
- Self‑hosted uploads

Only **authors and administrators** can add videos.

System priorities:
- minimal disk usage
- minimal CPU load
- fast page loading
- responsive layout
- lazy loading

---

# 1 Access Control

Allowed roles:
- admin
- author

Regular users cannot upload or insert videos.

---

# 2 Editor Integration

Add toolbar button:

Insert Video

Modal options:
1. Insert video link
2. Upload video file

---

# 3 External Links

Supported platforms:

YouTube  
VK Video  
Rutube

The system must:
- detect platform
- extract video ID
- convert to embed iframe

---

## YouTube

Accepted links:

https://www.youtube.com/watch?v=VIDEO_ID  
https://youtu.be/VIDEO_ID

Embed:

<iframe src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

---

## VK Video

Example:

https://vk.com/video-XXXXX_YYYYY

Embed:

<iframe src="https://vk.com/video_ext.php?oid=-XXXXX&id=YYYYY" frameborder="0" allowfullscreen></iframe>

---

## Rutube

Example:

https://rutube.ru/video/VIDEO_ID/

Embed:

<iframe src="https://rutube.ru/play/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

---

# 4 Uploading Video

Allowed formats:

mp4  
mov  
webm  
mkv

Maximum upload size:

100 MB

Server validation:
- MIME type
- extension
- size

---

# 5 Compression

Videos must be processed with FFmpeg.

Output format:

MP4 container  
H.264 codec  
AAC audio  
max resolution 720p  
max 30 fps

Metadata should be removed.

---

## Optimized Command

ffmpeg -i input_file \
-vf "scale='min(1280,iw)':-2,fps=30" \
-c:v libx264 \
-preset veryfast \
-crf 24 \
-movflags +faststart \
-map_metadata -1 \
-c:a aac \
-b:a 128k \
output.mp4

Benefits:
- limits resolution
- limits fps
- removes metadata
- optimized streaming

---

# 6 Storage

Videos:

/uploads/videos/

Thumbnails:

/uploads/video_thumbs/

Use UUID filenames.

Example:

/uploads/videos/a82bc3.mp4  
/uploads/video_thumbs/a82bc3.jpg

---

# 7 Thumbnail Generation

Generate preview frame at 2 seconds.

Command:

ffmpeg -ss 2 -i video.mp4 -frames:v 1 -vf "scale=640:-1" thumb.jpg

Thumbnail width:

640px

---

# 8 Remove Original

After compression delete original file.

Keep only optimized MP4.

---

# 9 HTML5 Player

Use native browser player:

<video controls preload="metadata">
<source src="/uploads/videos/file.mp4" type="video/mp4">
</video>

---

# 10 Lazy Loading

Initial block:

<div class="video-block" data-video="/uploads/videos/file.mp4">
<img src="/uploads/video_thumbs/file.jpg" class="video-thumb">
<button class="video-play">▶</button>
</div>

Load video only after click.

---

# 11 Lazy Loading External

External videos should load iframe only after click.

Example YouTube preview:

https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg

---

# 12 Responsive Layout

.video-wrapper {
position: relative;
width: 100%;
padding-top: 56.25%;
}

.video-wrapper iframe,
.video-wrapper video {
position: absolute;
top:0;
left:0;
width:100%;
height:100%;
}

---

# 13 Background Processing

Processing flow:

1 upload
2 save temp file
3 queue job
4 worker runs ffmpeg
5 save compressed video
6 delete original

---

# 14 UI Feedback

Show:

Uploading video...
Processing video...

After completion:

Video inserted into editor

---

# 15 Typical Sizes

30 sec → 8‑12 MB  
60 sec → 15‑20 MB  
2 min → 30‑40 MB

---

# 16 Performance Goals

- reduce CPU usage
- reduce disk space
- avoid loading video before interaction
- support mobile browsers

---

End of specification v2
