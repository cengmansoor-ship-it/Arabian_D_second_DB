---
name: pre-existing artifact with no registered workflow
description: What to do when an artifact.toml exists on disk but listArtifacts()/WorkflowsRestart don't know about it
---

On a freshly imported pnpm-workspace project, `artifacts/<slug>/.replit-artifact/artifact.toml` can exist on
disk (checked into git) while `listArtifacts()` returns `[]` and `WorkflowsRestart` with the documented
`artifacts/<slug>: <service-name>` name fails with "doesn't exist in config". The artifact was never
registered as a managed workflow in this environment/session.

**How to apply:** don't fight `WorkflowsRestart` for a name that isn't registered. Fall back to a plain
`configureWorkflow` callback using the `run` command from the artifact's own `artifact.toml`
(`[services.development].run`), matching its `localPort`. Note `configureWorkflow` has **no `env` param** —
inline required env vars directly in the command string, e.g.
`"PORT=8080 pnpm --filter @workspace/api-server run dev"`.
