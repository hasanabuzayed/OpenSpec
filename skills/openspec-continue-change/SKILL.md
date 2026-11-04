---
name: openspec-continue-change
description: Continue working on an OpenSpec change by creating the next artifact. Use when the user wants to progress their change, create the next artifact, or continue their workflow. Also use when the user says "openspec continue" or "opsx continue".
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Continue work on a change. Create the next artifact.

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

**Input**: You can specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes sorted by most recently updated, and ask the user to select one

   When you prompt, show the top 3-4 most recently updated changes as options. Show:
   - Change name
   - Status (e.g., "0/5 tasks", "complete", "no tasks")
   - How recently it changed (from `lastModified` field)

   Mark the most recently updated change as "(Recommended)" since it is likely what the user wants to continue.

   Always announce: "Using change: <name>". Also show how to override it, for example, `/openspec-continue-change <other>`.

2. **Check current status**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand the current state. The response includes:
   - `schemaName`: The workflow schema in use (for example, "spec-driven")
   - `artifacts`: Array of artifacts with their status ("done", "skipped", "ready", "blocked")
   - `isPlanningComplete`: Boolean that shows if all planning artifacts are complete. Older CLI versions expose the same value as `isComplete`.
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

3. **Act based on status**:

   ---

   **Before anything else, finish a partly written artifact**:
   - An artifact whose output is a glob pattern (for example, `specs/**/*.md`) reads `done` as soon as one matching file exists. If a run stops while it writes the files, the artifact reads `done` with some files still missing.
   - For each such `done` artifact, first get its instructions and read any completed dependencies needed to determine the expected files.
     Then compare those files with `artifactPaths.<id>.existingOutputPaths`.
     For spec-driven's `specs`, read the proposal and check for one `specs/<capability-path>/spec.md` per capability it lists.
     Resolve each expected path against `changeRoot` before comparing path identity.
     After resolving symlinks, verify each path remains inside `changeRoot`.
     Check both its parent directories and the file itself if it already exists
   - Never write an expected path that fails that check. Stop and tell the user.
     If any are missing, write only the missing files, each at its checked path.
     When the `instruction` field delegates creation, invoke the skill or command only if it can write each file to its checked path.
     Otherwise stop and tell the user - and STOP - that counts as this invocation's ONE artifact.
     If you cannot tell whether a file was left out on purpose, ask the user

   ---

   **If all planning artifacts are complete (`isPlanningComplete: true`, or legacy `isComplete: true`)**:
   - Congratulate the user
   - Show final status including the schema used
   - Suggest: "Planning is complete! You can now implement this change. Once implementation and any tracked work are complete, archive it."
   - STOP

   ---

   **If artifacts are ready to create** (status shows artifacts with `status: "ready"`):
   - Pick the FIRST artifact with `status: "ready"` from the status output
   - Get its instructions:
     ```bash
     openspec instructions <artifact-id> --change "<name>" --json
     ```
   - Parse the JSON. The key fields are:
     - `context`: Project background (constraints for you - do NOT include in output)
     - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
     - `template`: The structure to use for your output file
     - `instruction`: Schema-specific guidance
     - `resolvedOutputPath`: Resolved path or pattern to write the artifact
     - `dependencies`: Completed artifacts to read for context (entries with `skipped: true` have no files - do not look for them)
     - `skipped`/`warning`: present when the change declares skip_specs and this artifact must NOT be created - pick another artifact
   - **Create the artifact file**:
     - Read any completed dependency files for context. Always re-read them from disk, even if you saw them earlier in the conversation. They may have edits from the user since then.
     - Choose the output path before creating anything.
       If the `resolvedOutputPath` specified in instructions is a glob pattern, choose a concrete path inside `changeRoot`.
       Use the schema instruction and the change's context.

       After resolving symlinks, verify the path remains inside `changeRoot`.
       Check both its parent directories and the file itself if it already exists.
       If it does not, stop and tell the user. Otherwise the output path is `resolvedOutputPath`
     - If the `instruction` field delegates creation to a specific skill or command, invoke it only if it can write the artifact to that output path. Otherwise stop and tell the user
     - Otherwise, write it yourself:
       - Use `template` as the structure - fill in its sections
       - Apply `context` and `rules` as constraints when writing - but do NOT copy them into the file
       - Write the file to that output path
     - Either way, verify the artifact file exists at that output path
   - Show what was created and what is now unlocked
   - STOP after creating ONE artifact

   ---

   **If no artifacts are ready (all blocked)**:
   - This should not happen with a valid schema
   - Show status and suggest checking for issues

4. **After creating an artifact, show progress**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After each invocation, show:
- Which artifact was created
- Schema workflow in use
- Current progress (N/M complete)
- What artifacts are now unlocked
- Prompt: "Want to continue? Just ask me to continue or tell me what to do next."

**Artifact Creation Guidelines**

The artifact types and their purpose depend on the schema. The `instruction` field from the instructions output is the authoritative guidance for each artifact.

Follow it even when the artifact has a familiar name (proposal.md, tasks.md, etc.).
Custom schemas may define different content or a different process for the same file names.

If the `instruction` field directs you to a specific skill or command, invoke it to create the artifact instead of writing the artifact directly.
Invoke it only once you have chosen and checked the output path, and only if it can write there.

**Guardrails**
- Create ONE artifact per invocation
- Always read dependency artifacts before creating a new one - re-read from disk, not from conversation memory (files can change after you see them)
- Never skip artifacts or create out of order
- If context is unclear, ask the user before creating
- Verify the artifact file exists after writing before you mark progress
- Use the schema's artifact sequence, do not assume specific artifact names
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output
