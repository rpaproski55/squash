---
name: design
description: Stage 2 (thinking tier). Turn an approved spec into handoffs/<feature>/design.md. Run in a session on the best model available (e.g. Fable or Opus).
disable-model-invocation: true
argument-hint: "<feature-name>"
---
Design: $ARGUMENTS

1. Check `handoffs/<feature>/spec.md` is `Status: approved`; stop if not.
2. Act as the **architect** yourself, following `.claude/agents/architect.md`. Don't spawn an agent: the session's model is the point.
3. Check the design covers every spec outcome and lists tests.
4. Commit, push, and tell the owner in ≤5 lines: approach, what changes for them, open questions. Big changes wait for their approval.
