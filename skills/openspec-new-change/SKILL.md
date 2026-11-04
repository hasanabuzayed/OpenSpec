---
name: openspec-new-change
description: Start a new OpenSpec change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured step-by-step approach. Also use when the user says "openspec new change" or "opsx new".
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
---

Use the experimental artifact-driven approach to start a new change.

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

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Ask the user (open-ended, no preset options):
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (for example, "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Determine the workflow schema**

   Use the default schema (omit `--schema`) unless the user explicitly requests a different workflow.

   **Use a different schema only if the user mentions:**
   - A specific schema name → use `--schema <name>`
   - "show workflows" or "what workflows" → run `openspec schemas --json` and let them choose

   **Otherwise**: Omit `--schema` to use the default.

3. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   Only if the user requested a specific workflow, add `--schema <name>`.
   This creates a scaffolded change in the planning home that the CLI resolves.

4. **Show the artifact status**
   ```bash
   openspec status --change "<name>" --json
   ```
   Use the returned `planningHome`, `changeRoot`, `artifactPaths`, and `nextSteps` instead of assuming repo-local paths.

5. **Get instructions for the first artifact**
   The first artifact depends on the schema (for example, `proposal` for spec-driven).
   Examine the status output to find the first artifact with status "ready".
   ```bash
   openspec instructions <first-artifact-id> --change "<name>"
   ```
   This outputs the template and context to create the first artifact.

6. **STOP and wait for user direction**

**Output**

After you complete the steps, summarize:
- Change name and location
- Schema/workflow in use and its artifact sequence
- Current status (0/N artifacts complete)
- The template for the first artifact
- Prompt: "Ready to create the first artifact? Just describe what this change is about and I will draft it, or ask me to continue."

**Guardrails**
- Do NOT create any artifacts yet - just show the instructions
- Do NOT advance beyond showing the first artifact template
- If the name is invalid (not kebab-case), ask for a valid name
- If a change with that name already exists, suggest continuing that change instead
- If using a non-default workflow, pass --schema
