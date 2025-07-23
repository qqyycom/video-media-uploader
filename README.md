# 视频上传平台

一个现代化的视频上传平台，支持一键上传视频到 YouTube 和 TikTok。基于 Next.js 15 构建，提供直观的用户界面和流畅的上传体验。

## 功能特性

### ✅ 已完成功能

- **账号绑定**
  - YouTube OAuth 2.0 集成
  - TikTok API 集成
  - 账号信息显示与管理
  - 一键解绑功能

- **视频上传**
  - 拖拽上传支持
  - 多格式视频支持 (MP4, MOV, AVI)
  - 文件大小验证 (YouTube: 128GB, TikTok: 10GB)
  - 视频预览功能
  - 实时文件信息展示

- **元数据编辑**
  - 标题、描述、标签编辑
  - 隐私设置 (公开/不公开/私密)
  - 分类选择
  - 标签管理

- **上传管理**
  - 实时上传进度
  - 上传状态跟踪
  - 取消上传功能
  - 失败重试机制

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 组件**: Tailwind CSS + shadcn/ui
- **状态管理**: React Context API + useReducer
- **文件上传**: react-dropzone
- **图标**: lucide-react

## 快速开始

### 安装依赖
```bash
npm install
```

### 环境配置
```bash
cp .env.example .env.local
```

编辑 `.env.local`：
```bash
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 部署

### Vercel 部署
```bash
npm run build
npm start
```

### 项目结构
```
src/
├── app/
│   ├── api/           # API 路由
│   ├── components/    # React 组件
│   ├── context/       # 状态管理
│   ├── hooks/         # 自定义 Hooks
│   ├── lib/           # 工具函数
│   └── types/         # 类型定义
└── public/            # 静态资源
```
