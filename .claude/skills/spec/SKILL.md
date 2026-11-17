---
name: spec
description: Stage 1 (workhorse tier). Turn the owner's brain-dump into handoffs/<feature>/spec.md — outcomes, UX, constraints; no technical decisions.
disable-model-invocation: true
argument-hint: "<feature-name> [brain-dump]"
---
Write the spec for: $ARGUMENTS

1. Use a kebab-case feature name; create `handoffs/<feature>/`.
2. Fill `handoffs/_templates/spec.md` from the owner's words and the project docs. No technical decisions.
3. Ask at most 3 questions, only ones that change the spec.
4. Show the outcomes in ≤5 lines; on approval set `Status: approved`. Update `handoffs/STATUS.md`, commit, push.
