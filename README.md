# Spring Bloom Planner

A photorealistic 3D nature-driven weekly planner with immersive, cinematic UI powered by AI.

## Features

- 🌿 Immersive nature-themed weekly planner
- ✦ AI Chief of Staff with Gemini-powered planning assistance
- 🍒 Smart task prioritization and scheduling
- 🌅 Deep focus mode with ambient sounds
- 📊 Weekly analytics and streak tracking
- 📝 Journal integration

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Edge Functions + Auth)
- Google Gemini AI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- Supabase project

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

For AI features, set either `GOOGLE_API_KEY` or `GEMINI_API_KEY` environment variable in your Supabase edge function configuration.

### Building

```bash
# Production build
npm run build
```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Deploy the edge functions from the `supabase/functions` directory
3. Configure the `GOOGLE_API_KEY` secret in Supabase

## License

MIT