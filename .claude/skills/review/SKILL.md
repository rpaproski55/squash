---
name: review
description: Stage 4 (thinking tier). Adversarial review of a built feature against its spec and design. Run in a session on the best model available.
disable-model-invocation: true
argument-hint: "<feature-name>"
---
Review: $ARGUMENTS

1. Act as the **critic** yourself, following `.claude/agents/critic.md`. Don't spawn an agent.
2. Write `review.md`, commit, push.
3. Tell the owner in ≤5 lines: verdict and finding titles. Fixes go back to a workhorse session (`/build` reads `review.md`).
