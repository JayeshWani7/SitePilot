# SitePilot AI Modules (Gemini)

Independent AI modules with a dedicated backend service and a professional frontend console.

## Included AI Modules

- Onboarding Wizard
- Component Suggester
- Brand Consistency Guard
- Usage Coach
- SEO Copilot

## Project Structure

- `apps/ai-backend`: Fastify API service for AI modules
- `apps/ai-frontend`: Next.js frontend with module forms

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env files:

```bash
cp apps/ai-backend/.env.example apps/ai-backend/.env
cp apps/ai-frontend/.env.example apps/ai-frontend/.env.local
```

3. Set your Gemini key in `apps/ai-backend/.env`:

```env
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY
```

## Run

Start backend:

```bash
npm run dev:backend
```

Start frontend:

```bash
npm run dev:frontend
```

Frontend: `http://localhost:3000`

Backend health: `http://localhost:4001/health`

## API Endpoints

- `POST /api/ai/chat/respond`
- `POST /api/ai/onboarding/generate-site`
- `POST /api/ai/component-suggester/recommend`
- `POST /api/ai/brand-consistency/check`
- `POST /api/ai/usage-coach/recommend`
- `POST /api/ai/seo-copilot/generate`
