---
name: openspec-update-change
description: Update an OpenSpec change by revising its existing planning artifacts and keeping them coherent with one another. Use when the user wants to revise a change's plan, fold new decisions into it, or reconcile its artifacts after an edit. Also use when the user says "openspec update change" or "opsx update". If the user means the openspec update CLI command, which refreshes generated files, run that command instead. Never edits code.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Revise the existing planning artifacts for a change and keep them consistent with each other. Never edit code.

**Store selection:** A store is a standalone OpenSpec repo registered on this machine. If the user names a store or the work lives in one, run `openspec store list --json`. Use it to find registered store ids.

Then pass `--store <id>` on commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `schemas`, `view`). Once selected, keep `--store <id>` for the rest of the workflow.

Every unscoped example of those commands below is shorthand. Before running it, append the flag. For example, run `openspec status --change "<name>" --json --store "<id>"`, not the unscoped form shown below.

Other commands do not take the flag. Hints from commands already carry the flag. Keep it on follow-up commands. Without a store, commands act on the nearest local `openspec/` root.

**Project check:** These steps expect a project that already uses OpenSpec.

Before the first step that writes anything (`new change`, `archive`, `sync specs`, or authoring an artifact file), make sure that the project has a root.

Run `openspec list --json` and read `root`.

When a store is selected, use `--store <id>`, since the store is then the root.

A root object means the project is set up. `"root": null` means it is not set up.

There is no `openspec/` directory here. A write such as `openspec new change` would create one as a side effect.

The command also exits non-zero. This is the answer, not a broken CLI. Read the JSON instead of retrying or working around it.

One `"root": null` is not about setup.

When a `status` error message starts with `Declared in` or `Invalid store declaration in` and names this project's `openspec/config.yaml` (or `config.yml`), the project does use OpenSpec through a store it declares.

This machine cannot resolve that store. The store is not registered, or the `store:` line is malformed.

Do not treat it as uninitialized. Do not skip the branches below. Stop before writing and show the user that error's `message` and `fix`.

Otherwise, with no root, what happens next depends on how this workflow was reached:

- **Auto-selected**: you chose this workflow yourself, without the user naming OpenSpec, naming this skill, or running its slash command. Stop using OpenSpec. Answer the request normally, as you would with no OpenSpec installed. Do not ask them to set anything up and do not mention OpenSpec setup.
- **Explicit OpenSpec request**: the user named OpenSpec, named this skill, or ran its slash command. Stop before writing and ask how to proceed. Ask whether to set this project up (`openspec init`), target a store they already have (`--store <id>`), or continue without OpenSpec for this request. Wait for their answer.

In both branches, never create the root as a side effect. Also do not run `openspec init` until the user asks for it. Also do not hand-create `openspec/` files. Also do not let a command create the root.

**Input**: You can specify a change name. If omitted, check if you can infer it from conversation context. If vague or ambiguous you MUST prompt for available changes.

This workflow revises artifacts that already exist. `/openspec-continue-change` is what creates the ones that do not.

**Steps**

1. **Select the change**

   If the user provides a name, use it. Otherwise:
   - If the user mentioned a change, infer it from conversation context
   - If only one active change exists, select it automatically
   - If ambiguous, run `openspec list --json` to get available changes sorted by most recently updated, and ask the user to select one

   When you prompt, show the top 3-4 most recently updated changes as options, showing:
   - Change name
   - Status (e.g., "0/5 tasks", "complete", "no tasks")
   - How recently it changed (from `lastModified` field)

   Mark the most recently updated change as "(Recommended)" since it is likely what the user wants to update.

   Always announce: "Using change: <name>" and how to override (e.g., `/openspec-update-change <other>`).

2. **Get the change's artifacts**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand the current state. The response includes:
   - `schemaName`: The workflow schema in use (for example, "spec-driven")
   - `artifacts`: Array of artifacts with their status ("done", "skipped", "ready", "blocked")
   - `isPlanningComplete`: Boolean that shows if all planning artifacts are complete. Older CLI versions expose the same value as `isComplete`.
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

   The artifact ids and paths come from the active schema - do NOT assume them, and do NOT branch on hardcoded artifact names. Custom schemas must work unchanged.

   The files to edit are `artifactPaths.<id>.existingOutputPaths` - the concrete files that exist on disk, already glob-expanded for glob artifacts (e.g. `specs/**/*.md`), plus any confirmed concrete path allowed under a partly populated glob artifact (step 4). Do NOT write to `resolvedOutputPath`: for a glob artifact it is still the glob pattern, not a real file.

3. **Understand the request**
   - If the user asked for a specific revision ("the design now uses X"), that is the starting edit.
   - If they only said "update" / "make this coherent", treat it as a coherence review. Read the existing artifacts and check them against each other for contradictions, gaps, and duplication.

4. **Read and reconcile**
   - Read the artifact(s) the request touches and the change's other existing artifacts.
   - Draft the requested edit in the conversation, not in files. Work out exactly what it changes. Step 5 owns every write.

     Then check every other existing artifact against the drafted edit - in ANY direction. An edit to a later artifact may need revising an earlier one, not only the other way around. Build order is a useful reading order, not a constraint on which artifacts may be revised.
   - Note everything that is now inconsistent, missing, or contradictory.
   - Propose revisions to files that already exist (`existingOutputPaths`). If an artifact has no existing output files and status `ready` or `blocked`, note it and point the user to `/openspec-continue-change` to create them. Leave `skipped` artifacts untouched. Also do not treat them as missing or defer them to the continue workflow.
   - A glob artifact (e.g. `specs/**/*.md`) is marked `done` after at least one file matches. The continue workflow only handles `ready` artifacts. When reconciliation identifies a missing file for a glob artifact whose `existingOutputPaths` is non-empty:
     1. Run `openspec instructions "<artifact-id>" --change "<name>" --json`. Use its `instruction` and `template`. Treat `context` and `rules` as constraints. Also do not copy them into the file. If instructions report `skipped: true`, do not create the file.

        Read current dependency files from disk. If a needed non-skipped dependency is missing, stop and ask the user to restore it first.
     2. Choose a concrete path inside `changeRoot` that matches `artifactPaths.<id>.outputPath` and does not already exist. Make sure that it remains inside `changeRoot` after you resolve any symlinked parent directories. The glob `resolvedOutputPath` is not a valid target.
     3. Include the new file in step 5's proposed revisions and create it only after the user confirms.
     4. After confirmation, immediately before creation, refresh status and instructions. Make sure that the artifact is still in scope, not skipped, and partially populated. Repeat the concrete-path checks above.
     5. Use a create operation that fails if the target already exists. If `instruction` delegates creation to another skill or command, invoke it only if it can honor the confirmed path and these guardrails. Otherwise stop. If any check fails or the confirmed draft is no longer valid, stop. Reconcile with the user rather than replacing existing content or choosing a different path.
   - If the change is already coherent, say so and propose no revisions.

5. **Confirm and apply, one artifact at a time**
   - This step does every artifact write in this workflow. No earlier step edits an artifact.
   - Show each proposed revision and its reason - including the requested edit drafted in step 4. Write only after the user confirms.
   - If the user rejects a revision, do not write it - leave that artifact unchanged.
   - When a substantial rewrite is needed, get that artifact's rules and template first:
     ```bash
     openspec instructions "<artifact-id>" --change "<name>" --json
     ```

6. **Point to the next step (guidance only - NEVER act on it)**
   - Artifacts with empty `existingOutputPaths` and status `ready` or `blocked` -> suggest `/openspec-continue-change` to create them.
   - Change already implemented (tasks checked off / already applied) -> the code may no longer match the revised plan. Suggest `/openspec-apply-change` to carry the delta into code.
   - Everything done and implemented -> suggest `/openspec-archive-change`.

**Output**

After each invocation, show:
- Which artifacts were revised (and which proposed revisions were rejected)
- Any file created under a glob artifact that was already partially populated
- Anything deferred to `/openspec-continue-change` (artifacts with no files yet and status `ready` or `blocked`, never `skipped` artifacts)
- Where the change stands and the recommended next command

**Guardrails**
- Planning artifacts only - NEVER edit implementation code. If the revised plan implies code changes, stop and point to `/openspec-apply-change`.
- Use the artifact ids and paths reported by `openspec status`. Also never branch on hardcoded artifact names.
- Edit only the concrete files in `existingOutputPaths`, plus any confirmed concrete path allowed under a partly populated glob artifact (step 4). Also never write to a glob `resolvedOutputPath`.
- Do not advance the build frontier: if an artifact has empty `existingOutputPaths` and status `ready` or `blocked`, that is `/openspec-continue-change`'s job. Leave `skipped` artifacts untouched. The only new-file scope is a confirmed concrete path under a glob artifact whose `existingOutputPaths` is non-empty.
- Confirm every edit with the user before writing.
- If the request changes the change's *intent* rather than refining it, recommend starting fresh with `/openspec-new-change` (the "Update vs. Start Fresh" heuristic).
