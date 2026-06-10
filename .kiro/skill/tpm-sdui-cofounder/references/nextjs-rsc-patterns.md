# Next.js App Router & RSC Patterns

Patterns for the Knowledge Hub — App Router, streaming, RSC/Client boundaries,
and Neon DB integration. Bootstrap-budget assumptions throughout.

---

## RSC / Client Boundary Decision Tree

```
Does the component need...
├── useState / useReducer?          → 'use client'
├── useEffect / useLayoutEffect?    → 'use client'
├── Browser APIs (window, etc.)?    → 'use client'
├── Event listeners (onClick, etc.)? → 'use client'  [NOTE: passing handlers as props is fine from RSC]
├── Framer Motion animations?       → 'use client'
└── None of the above?              → Server Component (default, zero JS bundle)
```

**Key insight**: Client Components add to the JS bundle. Every `'use client'` directive
should be a deliberate decision with a noted bundle cost.

---

## Streaming with Suspense (RSC)

```typescript
// app/learn/[slug]/page.tsx
import { Suspense } from 'react'
import { PageSkeleton } from '@/components/skeletons/PageSkeleton'
import { SDUIRenderer } from '@/components/sdui/SDUIRenderer'

// This is a Server Component — no 'use client'
export default function LearnPage({ params }: { params: { slug: string } }) {
  return (
    // Outer shell renders instantly (HTML shell + skeleton)
    <div className="min-h-screen">
      <Suspense fallback={<PageSkeleton />}>
        {/* SDUIRenderer is async — streams in when data is ready */}
        <SDUIRenderer slug={params.slug} />
      </Suspense>
    </div>
  )
}
```

```typescript
// components/sdui/SDUIRenderer.tsx — async Server Component
import { db } from '@/lib/db'
import { SDUIPageSchema } from '@/lib/schemas/sdui'
import { SDUIBlockRenderer } from './SDUIBlockRenderer'

// async RSC — Next.js streams this as data arrives
export async function SDUIRenderer({ slug }: { slug: string }) {
  const row = await db.query(
    'SELECT payload FROM pages WHERE slug = $1 AND status = $2',
    [slug, 'published']
  )

  if (!row.rows[0]) {
    // Return not-found UI inline (don't throw — streaming doesn't catch well)
    return <div>Page not found.</div>
  }

  const page = SDUIPageSchema.parse(row.rows[0].payload)

  return (
    <>
      {page.blocks
        .sort((a, b) => a.order - b.order)
        .map(block => (
          <SDUIBlockRenderer key={block.id} block={block} />
        ))}
    </>
  )
}
```

---

## Neon DB Connection (Pooler-Safe)

Always use the **pooler endpoint** for Next.js (serverless / Cloud Run scale-to-zero).
Direct connections exhaust Postgres connection limits on cold starts.

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless'

// Uses pooler endpoint from env — set NEON_DATABASE_URL to pooler URL
const sql = neon(process.env.NEON_DATABASE_URL!)

export const db = {
  query: async <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = []
  ): Promise<{ rows: T[] }> => {
    const rows = await sql(text, params) as T[]
    return { rows }
  }
}
```

```bash
# .env.local
# Use pooler endpoint (port 5432 pooled, not direct)
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

## Server Actions (Form Mutations)

```typescript
// app/actions/progress.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MarkCompleteSchema = z.object({
  userId: z.string().uuid(),
  blockId: z.string().uuid(),
  xpEarned: z.number().int().positive(),
})

export async function markBlockComplete(input: unknown) {
  const { userId, blockId, xpEarned } = MarkCompleteSchema.parse(input)

  await db.query(
    `INSERT INTO user_progress (user_id, block_id, completed_at, xp_earned)
     VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (user_id, block_id) DO NOTHING`,
    [userId, blockId, xpEarned]
  )

  // Invalidate the user's progress cache
  revalidatePath(`/profile/${userId}`)
}
```

---

## Dynamic Metadata (OG Images)

```typescript
// app/learn/[slug]/opengraph-image.tsx
// Next.js generates this as an Edge Function automatically
import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }

export default async function OGImage({ params }: { params: { slug: string } }) {
  const row = await db.query<{ title: string; subtitle: string }>(
    'SELECT title, subtitle FROM pages WHERE slug = $1',
    [params.slug]
  )
  const page = row.rows[0] ?? { title: 'Learn', subtitle: '' }

  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div style={{ fontSize: 60, fontWeight: 800, color: 'white', textAlign: 'center' }}>
        {page.title}
      </div>
      <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', marginTop: 20 }}>
        {page.subtitle}
      </div>
    </div>
  )
}
```

---

## Performance Checklist (Per Page)

Before shipping any new page/route, verify:

| Check | Tool | Target |
|-------|------|--------|
| No unnecessary `'use client'` | Code review | Minimize Client Components |
| Bundle size delta | `next build` output | < 10KB per new Client Component |
| LCP element identified | Chrome DevTools | < 1.2s |
| Suspense boundaries placed | Code review | No waterfalls |
| Neon pooler endpoint used | `NEON_DATABASE_URL` check | Must use pooler |
| Images use `next/image` | Code review | All `<img>` → `<Image>` |
| OG image defined | Route check | Every public page |

---

## Environment Variables Checklist

```bash
# Required for production
NEON_DATABASE_URL=          # Neon pooler endpoint
NEXTAUTH_SECRET=            # Auth.js secret
NEXTAUTH_URL=               # Canonical URL
NEXT_PUBLIC_APP_URL=        # Client-accessible base URL

# Optional (feature flags)
NEXT_PUBLIC_ENABLE_CANVAS_PROTECTION=true
OLLAMA_BASE_URL=http://localhost:11434   # Local AI pipeline
```