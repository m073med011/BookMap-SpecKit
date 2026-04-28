# SpecKit Commands and Prompts

## 1. Project Initialization
```bash
specify init <PROJECT_NAME>
```
**Instruction:** Create plan `@PLAN.md` on AI chat module.

---

## 2. Constitution Generation
```bash
/speckit-constitution
```
**Prompt:**
> This is a multi-vendor book e-commerce that will implement following this plan `@PLAN.md`. The implementation must follow best practices for best architecture, clean code, OOP, SOLID principles, best design system, system design, safe types, and a good secure system.

---

## 3. Specification Generation
```bash
/speckit-specify
```
**Prompt:**
> Read `@PLAN.md` and create a specification for the phase: `## Phase 3 — Catalog Core: Books, Listings, Formats, Metadata, Media`

---

## 4. Specification Clarification
```bash
/speckit-clarify ## Phase 3 — Catalog Core: Books, Listings, Formats, Metadata, Media
```

---

## 5. Implementation Planning
```bash
/speckit-plan Phase ## Phase 3 — Catalog Core: Books, Listings, Formats, Metadata, Media
```

---

## 6. Task Generation & Review
```bash
/speckit-tasks
```
**Prompt:**
> Create the tasks file so that a cheaper LLM model can implement without problems.

**Review Prompt:**
> The cheaper LLM model implemented the tasks. We need a deep review of the implementation.