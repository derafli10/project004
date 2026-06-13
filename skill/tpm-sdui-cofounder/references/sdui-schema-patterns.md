# SDUI JSON Schema Patterns

## Core Principle

The AI pipeline (Ollama/Llama 3) outputs a JSON payload. The Next.js RSC renderer
reads `component_type` and renders the matching component. No hardcoded page layouts exist.
The JSON IS the layout spec.

---

## Discriminated Union Pattern (TypeScript)

```typescript
// Base block — every SDUI block extends this
interface SDUIBlockBase {
  id: string           // uuid v4, stable across re-renders
  component_type: string
  order: number        // layout sequence, 0-indexed
  visibility?: 'public' | 'premium' | 'draft'
}

// Concrete block types
interface HeroCardBlock extends SDUIBlockBase {
  component_type: 'hero_card'
  title: string
  subtitle?: string
  cta_label: string
  cta_href: string
  bg_gradient: [string, string]  // CSS color stops
}

interface TimelineBlock extends SDUIBlockBase {
  component_type: 'timeline'
  heading: string
  events: Array<{
    year: number
    label: string
    description: string
    icon_emoji?: string
  }>
}

interface QuizModuleBlock extends SDUIBlockBase {
  component_type: 'quiz_module'
  question: string
  options: Array<{ id: string; text: string; is_correct: boolean }>
  explanation: string
  xp_reward: number
}

interface HabitTrackerBlock extends SDUIBlockBase {
  component_type: 'habit_tracker'
  habit_name: string
  frequency: 'daily' | 'weekly'
  streak_goal: number
  current_streak: number
}

// Union type — extend as new AI output types are added
export type SDUIBlock =
  | HeroCardBlock
  | TimelineBlock
  | QuizModuleBlock
  | HabitTrackerBlock

// Page-level payload from AI pipeline
export interface SDUIPage {
  page_id: string
  slug: string
  title: string
  meta_description: string
  og_image_url?: string
  blocks: SDUIBlock[]
  generated_at: string   // ISO 8601
  model_version: string  // e.g. "llama3:8b-q4_K_M"
}
```

---

## Zod Schema (Runtime Validation)

```typescript
import { z } from 'zod'

const HeroCardBlockSchema = z.object({
  id: z.string().uuid(),
  component_type: z.literal('hero_card'),
  order: z.number().int().nonnegative(),
  visibility: z.enum(['public', 'premium', 'draft']).optional(),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(240).optional(),
  cta_label: z.string().min(1).max(40),
  cta_href: z.string().url(),
  bg_gradient: z.tuple([z.string(), z.string()]),
})

const TimelineBlockSchema = z.object({
  id: z.string().uuid(),
  component_type: z.literal('timeline'),
  order: z.number().int().nonnegative(),
  visibility: z.enum(['public', 'premium', 'draft']).optional(),
  heading: z.string().min(1),
  events: z.array(z.object({
    year: z.number().int(),
    label: z.string(),
    description: z.string(),
    icon_emoji: z.string().optional(),
  })).min(1),
})

const QuizModuleBlockSchema = z.object({
  id: z.string().uuid(),
  component_type: z.literal('quiz_module'),
  order: z.number().int().nonnegative(),
  visibility: z.enum(['public', 'premium', 'draft']).optional(),
  question: z.string().min(1),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    is_correct: z.boolean(),
  })).min(2).max(6),
  explanation: z.string(),
  xp_reward: z.number().int().positive(),
})

export const SDUIBlockSchema = z.discriminatedUnion('component_type', [
  HeroCardBlockSchema,
  TimelineBlockSchema,
  QuizModuleBlockSchema,
  // ... add new block schemas here
])

export const SDUIPageSchema = z.object({
  page_id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(160),
  meta_description: z.string().max(320),
  og_image_url: z.string().url().optional(),
  blocks: z.array(SDUIBlockSchema).min(1),
  generated_at: z.string().datetime(),
  model_version: z.string(),
})
```

---

## RSC Renderer Pattern

```typescript
// app/[slug]/page.tsx — Server Component, zero client JS
import { SDUIBlockRenderer } from '@/components/sdui/SDUIBlockRenderer'
import { SDUIPageSchema } from '@/lib/schemas/sdui'

async function getPageData(slug: string) {
  // Fetch from Neon via pooler endpoint
  const raw = await db.query('SELECT payload FROM pages WHERE slug = $1', [slug])
  return SDUIPageSchema.parse(raw.rows[0]?.payload)
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await getPageData(params.slug)

  return (
    <main>
      {page.blocks
        .sort((a, b) => a.order - b.order)
        .map(block => (
          <SDUIBlockRenderer key={block.id} block={block} />
        ))
      }
    </main>
  )
}
```

```typescript
// components/sdui/SDUIBlockRenderer.tsx — Server Component switch
import type { SDUIBlock } from '@/lib/types/sdui'
import { HeroCard } from './HeroCard'
import { Timeline } from './Timeline'
import { QuizModule } from './QuizModule'   // 'use client' inside

export function SDUIBlockRenderer({ block }: { block: SDUIBlock }) {
  switch (block.component_type) {
    case 'hero_card':    return <HeroCard {...block} />
    case 'timeline':     return <Timeline {...block} />
    case 'quiz_module':  return <QuizModule {...block} />  // Client Component boundary
    default:
      // Exhaustiveness check — TypeScript will error if a new block type is unhandled
      const _exhaustive: never = block
      return null
  }
}
```

---

## AI Prompt Template (Ollama)

When prompting Llama 3 to generate SDUI JSON, use this system prompt pattern:

```
You are a structured data extractor. Given source content (text, article, notes),
output ONLY valid JSON matching this schema. No markdown, no explanation.

Schema: [paste SDUIPage TypeScript interface here]

Rules:
- Every block must have a unique UUIDv4 as `id`
- `order` must be sequential starting from 0
- `component_type` must be one of: hero_card, timeline, quiz_module, habit_tracker
- Strings must not exceed their defined max lengths
- `generated_at` must be current ISO 8601 datetime
- `model_version` must be "llama3:8b-q4_K_M"
```

---

## Adding New Block Types — Checklist

When the AI pipeline produces a new content format, follow this sequence:

1. [ ] Add TypeScript interface extending `SDUIBlockBase`
2. [ ] Add to `SDUIBlock` union type
3. [ ] Add Zod schema + add to `SDUIBlockSchema` discriminated union
4. [ ] Add case to `SDUIBlockRenderer` switch
5. [ ] Create the React component (RSC unless interactive)
6. [ ] Update Ollama system prompt with new `component_type`
7. [ ] Add example payload to test fixtures