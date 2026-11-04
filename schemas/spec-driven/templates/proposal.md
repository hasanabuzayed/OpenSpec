# Proposal

## Why

<!-- Explain why you propose this change. What problem does it solve? Why do you propose it now? -->

## What Changes

<!-- Describe what will change. Give specific details about new capabilities, changes, or removals. -->

## Capabilities

### New Capabilities
<!-- List the new capabilities. Name each capability for a cohesive system behavior.
     The behavior can own related requirements as the system evolves. Do not name
     implementation tasks or proposal sections. Avoid broad catch-all names. -->

<!-- Use kebab-case for new path segments (for example, user-auth or identity/user-auth).
     Follow the project's existing spec organization. Each creates
     specs/<capability-path>/spec.md. -->
- `<capability-path>`: <brief description of what this capability covers>

### Modified Capabilities
<!-- List existing capabilities with changes to REQUIREMENTS (not just implementation).
     Only list them here if spec-level behavior changes. Each needs a delta spec file.
     Use the exact existing path under openspec/specs/. If no requirement changes,
     leave this empty. -->

<!-- A change with no capabilities at all (pure refactor, tooling, docs)
     must set `skip_specs: true` in its .openspec.yaml. openspec validate rejects
     a zero-delta change without that marker. Do not invent a requirement just to
     satisfy validation. -->
- `<existing-capability-path>`: <what requirement changes>

## Impact

<!-- Affected code, APIs, dependencies, systems -->
