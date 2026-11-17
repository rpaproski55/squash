---
name: build
description: Stage 3 (workhorse tier). Implement an approved handoffs/<feature>/design.md, run checks, push.
disable-model-invocation: true
argument-hint: "<feature-name>"
---
Build: $ARGUMENTS

1. Check the design is `Status: approved`; stop if not. Work on a feature branch, never the default branch.
2. Act as the **builder** yourself, following `.claude/agents/builder.md`.
3. When checks pass, set the design to `Status: built`, push, and open or update the PR.
4. Tell the owner to run `/review <feature>` in a thinking-tier session.
