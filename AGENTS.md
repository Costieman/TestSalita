# Salita Quest Project Operating Rules

## Direct execution by default

When the user asks to proceed with an implementation task using phrases such as **go ahead**, **continue**, **next**, **merge**, **deploy**, **fix it**, or equivalent wording, treat that as authorization to complete the full available workflow directly.

This includes, where the connected tools permit:

- inspecting the repository;
- creating or updating branches;
- editing files;
- adding tests and validation;
- opening or updating pull requests;
- marking pull requests ready;
- merging approved work into `main`;
- triggering or completing deployment workflows;
- checking the deployed result;
- correcting follow-up defects.

Do not shift routine implementation, GitHub, merge, deployment, or verification steps back to the user. Do not ask the user to operate Cloud Shell, GitHub, or another interface when the connected tools can perform the action.

## Approval boundary

Do not request additional approval for routine changes that are already within the user's stated task. Ask only when a genuinely unresolved product decision, destructive action, unavailable credential, or safety-critical ambiguity prevents responsible execution.

## Status reporting

Clearly distinguish among:

1. code drafted locally or on a branch;
2. code committed;
3. pull request opened;
4. merged into `main`;
5. deployed;
6. verified in the live app.

Never describe a branch-only or merged-only change as visible in the live application. Continue through deployment and live verification when that workflow is available and is part of the user's request.

## Scope protection

Implement requested changes with the smallest safe scope. Preserve unrelated progression, mastery, rewards, economy, account, course, and persistence systems unless the user explicitly asks to modify them.
