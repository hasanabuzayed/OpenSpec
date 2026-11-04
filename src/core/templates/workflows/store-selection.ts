/**
 * Shared store-selection guidance for skill template workflows.
 *
 * Interpolated into every workflow's instructions so generated skills
 * consistently teach how to target a registered store with `--store <id>`.
 */
export const STORE_SELECTION_GUIDANCE = `**Store selection:** A store is a standalone OpenSpec repo registered on this machine. If the user names a store or the work lives in one, run \`openspec store list --json\`. Use it to find registered store ids.

Then pass \`--store <id>\` on commands that read or write specs and changes (\`new change\`, \`status\`, \`instructions\`, \`list\`, \`show\`, \`validate\`, \`archive\`, \`doctor\`, \`context\`, \`schemas\`, \`view\`). Once selected, keep \`--store <id>\` for the rest of the workflow.

Every unscoped example of those commands below is shorthand. Before running it, append the flag. For example, run \`openspec status --change "<name>" --json --store "<id>"\`, not the unscoped form shown below.

Other commands do not take the flag. Hints from commands already carry the flag. Keep it on follow-up commands. Without a store, commands act on the nearest local \`openspec/\` root.`;
