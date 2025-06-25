# 🎥 Video Upload & Compression API

A lightweight and efficient RESTful API for uploading and compressing video files. Built for applications that require smooth media handling, optimized file sizes, and scalable integration.

## 🚀 Features

- ✅ Upload video files via REST API
- 🗜️ Compress videos using [FFmpeg](https://ffmpeg.org/)
- 🎚️ Customizable compression settings (resolution, bitrate, format)
- ☁️ Storage options: local file system or cloud-ready integration
- 🔒 Secure file handling with MIME type validation
- 📁 Organized file structure and metadata management
- ⚙️ Built with Node.js & Express

---

## 📦 Tech Stack

- **Backend**: Node.js, Express
- **Video Processing**: FFmpeg
- **Storage**: Local file system (default) – can be extended to S3, GCS, etc.
- **Validation**: Multer (for file uploads), custom sanitizers

---

## 📂 Project Structure
video-upload-api/
├── controllers/
│ └── videoController.js
├── middleware/
│ └── upload.js
├── routes/
│ └── videoRoutes.js
├── services/
│ └── videoCompressor.js
├── uploads/
│ └── [compressed videos stored here]
├── .env
├── app.js
├── package.json
└── README.md


---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/video-upload-api.git
cd video-upload-api
```

### 2. Install Dependencies
npm install

### 3. Install FFmpeg
# For macOS using Homebrew
brew install ffmpeg

# For Ubuntu/Debian
sudo apt install ffmpeg

### 4. Start Server
npm start

---

## 📤 API Endpoints

POST /api/upload
Uploads and compresses a video.

Request (multipart/form-data)

| Field   | Type | Description          |
| ------- | ---- | -------------------- |
| `video` | File | Video file to upload |

Response

{
  "originalFile": "uploads/original/video.mp4",
  "compressedFile": "uploads/compressed/video_compressed.mp4",
  "message": "Upload and compression successful."
}




