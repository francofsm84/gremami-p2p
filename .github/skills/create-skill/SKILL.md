---
name: create-skill
description: 'Create reusable Copilot skills from observed workflows. Use for packaging repeatable procedures, decision points, and quality checks into a discoverable SKILL.md for project or personal use.'
argument-hint: 'Describe the workflow to package into a reusable skill'
user-invocable: true
disable-model-invocation: false
---

# Create a Reusable Skill

## When to Use
- The user is following a repeatable multi-step workflow that should be saved for reuse.
- A process needs to be generalized into a discoverable skill rather than kept as ad hoc chat guidance.
- A team or user wants a workflow that can be invoked later with slash commands or automatic discovery.

## Scope Decision
- Use a workspace skill for project-specific patterns: `.github/skills/<name>/SKILL.md`
- Use a personal skill for cross-workspace preferences: `~/.copilot/skills/<name>/SKILL.md`

## Procedure

### 1. Identify the Workflow
Review the conversation or project context and extract:
- the step-by-step process being followed
- decision points and branching logic
- success criteria and completion checks
- when the workflow should be used

### 2. Check for Missing Details
If the workflow is not yet clear, ask the user for the missing information:
- What outcome should this skill produce?
- Is this for the project or for the user profile?
- Is this a quick checklist or a full multi-step workflow?

### 3. Draft the Skill Metadata
Create the frontmatter carefully:
- `name`: must match the folder name and use lowercase letters, numbers, and hyphens
- `description`: must include clear trigger phrases and a short summary of the workflow
- `argument-hint`: optional but helpful for slash-command invocation
- `user-invocable`: set to `true` for slash-command use unless intentionally hidden

### 4. Write the Skill Body
Structure the skill with clear sections such as:
- `## When to Use`
- `## Scope Decision`
- `## Procedure`
- `## Quality Checks`
- `## Example Prompts`

Include:
- short, direct instructions
- exact steps the agent should follow
- branch conditions when the path changes
- checklists for completion or validation

### 5. Validate the Skill
Before finishing, confirm:
- the folder name matches the `name` field
- the `description` is keyword-rich and discoverable
- the file is in the correct location
- the YAML frontmatter is valid
- the body is concise and actionable
- all referenced files, if any, use relative paths like `./scripts/...`

### 6. Iterate and Improve
If the skill feels vague, refine it by tightening:
- unclear instructions
- weak trigger phrases
- missing decision branches
- absent quality criteria

A strong skill is specific enough that another agent can follow it without the original conversation.

## Quality Criteria
A skill is ready when it:
- solves a recurring workflow rather than a one-time task
- includes explicit decision logic and branching
- explains when to use it and how to judge success
- is small enough to load efficiently and easy to reuse

## Example Prompts
- "Package this debugging workflow into a reusable skill"
- "Create a project skill for reviewing a codebase before changes"
- "Turn this multi-step validation process into a discoverable workflow"
- "Draft a personal skill for my repeatable project setup process"

## Related Customizations to Create Next
- a project-level instruction for coding conventions
- a reusable prompt for generating implementation plans
- a custom agent for context-isolated review tasks
- a file instruction scoped to a folder such as `src/**/*.js`
