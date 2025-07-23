# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 15 video upload platform that enables users to upload videos to YouTube and TikTok simultaneously. The application provides OAuth integration for both platforms, video metadata editing capabilities, and real-time upload progress tracking.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check

# Environment setup
cp .env.example .env.local
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API + useReducer
- **File Upload**: react-dropzone
- **HTTP Client**: Axios
- **Icons**: lucide-react

### Project Structure
```
src/
├── app/
│   ├── api/                    # API routes for OAuth and upload
│   │   ├── youtube/
│   │   │   ├── auth/          # YouTube OAuth flow
│   │   │   └── upload/        # YouTube upload endpoints
│   │   └── tiktok/
│   │       ├── auth/          # TikTok OAuth flow
│   │       └── upload/        # TikTok upload endpoints
│   ├── components/            # React components
│   │   ├── VideoUpload/       # Main video upload form
│   │   ├── AccountBinding/    # Platform account connection UI
│   │   ├── UploadProgress/    # Upload status tracking
│   │   └── common/            # Reusable UI components
│   ├── context/               # React Context providers
│   │   └── AuthContext.tsx    # Authentication and account state
│   ├── hooks/                 # Custom React hooks
│   │   ├── useVideoUploads.ts # Upload management
│   │   └── useAccountConnections.ts # Account connection state
│   ├── types/                 # TypeScript type definitions
│   └── lib/                   # Utility functions
```

### Key Components

#### Authentication Flow
- **OAuth Integration**: YouTube and TikTok OAuth 2.0 flows
- **Token Management**: Automatic token refresh and storage
- **Account Persistence**: Local storage for account data
- **Context Provider**: Global auth state management

#### Upload System
- **File Handling**: Drag-and-drop video upload with validation
- **Metadata Editing**: Title, description, tags, privacy settings
- **Progress Tracking**: Real-time upload progress with retry/cancel
- **Multi-platform**: Simultaneous uploads to YouTube and TikTok

### Environment Variables

Required environment variables for development:
```bash
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API Endpoints

#### YouTube Integration
- `GET /api/youtube/auth` - OAuth authorization
- `GET /api/youtube/auth/callback` - OAuth callback handler
- `POST /api/youtube/upload` - Upload video to YouTube
- `GET /api/youtube/user` - Get connected account info

#### TikTok Integration
- `GET /api/tiktok/auth` - OAuth authorization
- `GET /api/tiktok/auth/callback` - OAuth callback handler
- `POST /api/tiktok/upload` - Upload video to TikTok
- `GET /api/tiktok/user` - Get connected account info

### Key Data Types

Located in `src/app/types/index.ts`:
- `VideoFile`: Video file metadata and preview
- `UploadMetadata`: Video upload configuration
- `UploadProgress`: Real-time upload status
- `YouTubeAccount`/`TikTokAccount`: Platform account information
- `AuthState`: Authentication and connection state

### Development Notes

- OAuth flows redirect to platform-specific callback URLs
- Account data stored in cookies and localStorage
- Upload progress uses optimistic updates with real API calls
- File validation includes size limits (YouTube: 128GB, TikTok: 10GB)
- Error handling includes token expiration detection and refresh
- All components use TypeScript with strict mode enabled