# 🎬 Video Upload & Compression API

A lightweight and efficient RESTful Node.js API for uploading, compressing, and serving video files in real time with progress tracking via Server-Sent Events (SSE). Built using `Express`, `Multer`, `fluent-ffmpeg`, and `workerpool`.

---

## 📌 Features

- 📤 Upload large video files with real-time progress
- 🗜️ Compress videos using `ffmpeg` with adjustable quality
- 🔄 Real-time Server-Sent Events (SSE) for:
  - Upload progress
  - Compression progress
  - Final upload result (video URL)
- ✅ Modular and scalable architecture using worker threads
- 🧩 Future support for custom codecs and resolutions
- 📂 The post_videos DB table

🧾 What metadata is stored (like URL, userId, duration, resolution, etc.)

🛢️ Database Integration
This API uses MongoDB to store video metadata in a collection called post_videos.

Each record contains:

Field	Description
videoUrl	Public URL of the compressed video
userId	ID of the uploading user
mediaId	Unique media identifier
requestId	Unique request tracking ID
duration	Duration of the video in seconds
resolution	Video resolution (e.g. 1920x1080)
size	Final compressed size (in bytes)
uploadDate	Timestamp of when video was stored

This enables tracking, analytics, and retrieval of user-uploaded videos.

---

## 📁 Project Structure

```
video_upload_compression/
│
├── assets/
│ └── video/ # Original & compressed videos
│
├── server/
│ ├── video/
│ │ ├── videoRoutes.js # API routes
│ │ ├── videoService.js # Main controller logic
│ │ ├── videoWorker.js # Worker thread for compression
│ │ └── videoConfig.json # Bitrate, codec config
│
├── utils/ # Response and sanity utilities
├── bin/www # Server entry
├── app.js # App setup and middleware
└── README.md
```


---

## 🧪 Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/deepvyas1/video_upload_compression.git

# 2. Navigate to the project
cd video_upload_compression

# 3. Install dependencies
npm install

# 4. Start the server
npm run dev:start
```

🔌 API Endpoints
✅ POST /api/video/upload
Description: Uploads and compresses a video file
Form-Data Params:

video: The video file (form-data)

userId: Unique user ID

requestId: Unique request ID

mediaId: Unique media ID

```
{
  "status": "success",
  "message": "Video uploaded and compression started"
}
```
Note: Progress updates are sent over SSE.

✅ GET /v1/api/user/sse/upload

Description: Connects to an SSE stream for upload/compression progress

Response (SSE Events):

```
event: media_compression_progress/media_upload_progress
progress: 45
progressType: "compression/upload"
data: { percent: 45 }

event: media_uploaded
data: {
  uploadedMediaInfo: {s3Url: "", mediaId: "", cfUrl: "This will be used to access the video"}
}
```

🔄 Reconnect logic should be handled in the frontend if the connection drops.

🖥️ Sample Frontend SSE Client

```
const eventSource = new EventSource(`baseUrl/v1/api/user/sse/upload?xcallerid=${mongoDb userId}&mtype=video`);

eventSource.onmessage = (message) => {};
```

🔮 Future Scope
🎛️ Add UI-based dropdowns for codec selection (x264, x265, vp9, etc.)

📐 Support for selecting custom output resolutions (e.g., 720p, 1080p)

📝 Add optional watermarking or branding overlay
