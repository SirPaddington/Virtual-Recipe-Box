# Virtual Recipe Box 🍳

A multi-user recipe management PWA built with Next.js and Supabase. Store, share, and access recipes with your family, with offline support for shopping trips.

## Features

- 📱 **Mobile-first PWA** - Install on your phone, works offline
- 👨‍👩‍👧‍👦 **Family sharing** - Share recipes with household members
- 🔢 **Recipe scaling** - Adjust quantities with multipliers
- 📝 **Dual units** - Track both imperial/volumetric and metric/weight measurements
- 🌳 **Recipe variations** - Create and track recipe iterations
- ⭐ **Favorites** - Quick access to your go-to recipes
- 💬 **Comments & notes** - Log cooking experiences and ratings
- 📥 **Import from URL** - Auto-import recipes from websites
-  **Offline shopping** - Save recipes for offline access while shopping

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth (email/password + magic links)
- **PWA**: next-pwa
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great!)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Virtual-Recipe-Box
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key
4. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migration

1. In your Supabase project, go to SQL Editor
2. Copy the contents of `supabase/migrations/20250101_initial_schema.sql`
3. Paste and run it in the SQL Editor

This creates all tables, enums, Row Level Security policies, and helper functions.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## Deployment

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

## Project Structure

```
Virtual-Recipe-Box/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/
│   │   ├── supabase/        # Supabase client config
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   ├── types/               # TypeScript types
│   └── middleware.ts        # Auth session refresh
├── public/                  # Static assets & PWA files
├── supabase/
│   └── migrations/          # Database schema
└── next.config.ts           # Next.js + PWA config
```

## Development Roadmap

See `implementation_plan.md` for the full development plan.

### Current Status: Phase 1 Complete ✅

- [x] Project setup
- [x] Supabase configuration
- [x] PWA setup
- [ ] Authentication system
- [ ] Recipe CRUD
- [ ] Multi-user features
- [ ] Offline caching
- [ ] Recipe import

## Contributing

This is a personal/family project, but feel free to fork and adapt for your own use!

## License

MIT
