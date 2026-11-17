<!-- agent-framework v1.0.0 · managed file: update with install.sh, put project-specific rules in CLAUDE.md -->
# How work moves through this project

Shared playbook for any model and any CLI. `CLAUDE.md` imports it (`@AGENTS.md`); other tools (Codex, Gemini CLI, …) can point their own instructions file at it. Project facts live in `CLAUDE.md` and `docs/`.

## Two tiers of model

| Tier | Use for | Pick (best available) |
|---|---|---|
| **Thinking** | Decisions: design and review | The strongest model you have: Fable, else Opus |
| **Workhorse** | Volume: specs and building | A cheaper fast model: Sonnet, or Muse Spark, Grok, GLM… where the tool allows |

Choose the model per session (`/model` in Claude Code). Roles never hard-code a model.

## The four stages

| Stage | Tier | Command | Writes | Rule |
|---|---|---|---|---|
| 1. Spec: what and why | Workhorse | `/spec <feature>` | `spec.md` | Outcomes, UX, constraints. **No technical decisions.** |
| 2. Design: how | Thinking | `/design <feature>` | `design.md` | Makes **every** decision, file-by-file plan, tests. **Doesn't edit project code.** |
| 3. Build | Workhorse | `/build <feature>` | code + `build-notes.md` | Implements the design exactly; records deviations; stops on real ambiguity. |
| 4. Review | Thinking | `/review <feature>` | `review.md` | Adversarial check against spec + design. Findings get outcomes. |

Then the owner tests and says **ship**.

## Sessions and hand-offs

- Run each stage in its own session on that tier's model. The files in `handoffs/<feature>/` are the only link, so a fresh session can pick up any stage.
- `handoffs/STATUS.md` says where the project stands. Update it at the end of every stage.
- Each file starts with `Status: draft | approved | built | reviewed · <date> · <role> (<model>)`.
- A stage starts only from an **approved** previous file. The owner approves specs and big designs.
- Commit in small steps; usage limits can cut a session short.

## When to skip stages

- Small fix: build directly, light review, no folder.
- Obvious design: spec → build → review.
- Real ambiguity (new flows, architecture, prompts, animation): all four.

## Budget

Thinking-tier models cost the most. Use them only for design and review, give them the spec and design rather than the whole repo, and never for routine edits.
