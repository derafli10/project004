# PRD Template

Use this structure for every Product Requirements Document. No prose walls — tables and code blocks only.

---

## Structure

```
# PRD: [Feature Name]
**Status**: Draft | Review | Approved
**Author**: [Founder]
**Last Updated**: [Date]
**Epic**: [Parent feature / initiative]

---

## 1. Problem Statement
One paragraph. What user pain, what metric this fixes.

## 2. Success Metrics
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| ...    | ...      | ...    | ...         |

## 3. User Stories
| As a... | I want to... | So that... | Priority |
|---------|-------------|------------|----------|
| ...     | ...         | ...        | P0/P1/P2 |

## 4. Acceptance Criteria
- [ ] Criterion 1 (testable, binary pass/fail)
- [ ] Criterion 2

## 5. Technical Specification Matrix
| Concern | Decision | Rationale |
|---------|----------|-----------|
| Data source | ... | ... |
| Component boundary | Server / Client | ... |
| State management | ... | ... |
| API contract | JSON Schema (see §6) | SDUI-driven |
| Performance target | LCP < 1.2s | Lighthouse 100 |

## 6. JSON Schema / SDUI Contract
[TypeScript interface + Zod schema + example payload]

## 7. Component Tree
[ASCII or mermaid tree of components with RSC/Client labels]

## 8. Out of Scope
- ...

## 9. Open Questions
| Question | Owner | Deadline |
|----------|-------|----------|
| ...      | ...   | ...      |
```

---

## Priority Definitions

| Label | Meaning |
|-------|---------|
| P0 | Blocks launch, must ship |
| P1 | High value, ship in same sprint |
| P2 | Nice to have, next sprint |
| P3 | Backlog, revisit at scale |

---

## Performance Targets (Non-Negotiable Defaults)

Always include these in the Technical Specification Matrix unless explicitly overridden:

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 100 |
| LCP | < 1.2s |
| CLS | 0 |
| FID / INP | < 100ms |
| JS Bundle (new Client Component) | < 10KB gzipped |
| Time to First Byte (TTFB) | < 200ms (RSC streaming) |