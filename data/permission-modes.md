Switch between supervised editing, read-only planning, and auto mode where a background classifier replaces manual permission prompts. Cycle modes with Shift+Tab in the CLI or use the mode selector in VS Code, Desktop, and claude.ai.

Copy page

Permission modes control whether Claude asks before acting. Different tasks call for different levels of autonomy: you might want full oversight for sensitive work, minimal interruptions for a long refactor, or read-only access while exploring a codebase.This page covers how to:
*   [Switch modes](https://code.claude.com/docs/en/permission-modes#switch-permission-modes) during a session, at startup, or as a default
*   [Choose a mode](https://code.claude.com/docs/en/permission-modes#available-modes) based on what Claude should be able to do without asking
*   [Run auto mode](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode) with background safety checks, and see what it [blocks by default](https://code.claude.com/docs/en/permission-modes#what-the-classifier-blocks-by-default)
*   [Plan changes read-only](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) before approving edits
*   [Restrict Claude to pre-approved tools](https://code.claude.com/docs/en/permission-modes#allow-only-pre-approved-tools-with-dontask-mode) for locked-down environments
*   [Skip checks entirely](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) in isolated environments

## [​](https://code.claude.com/docs/en/permission-modes#switch-permission-modes)

Switch permission modes

You can switch modes at any time during a session, at startup, or as a persistent default. The mechanism depends on where you’re running Claude Code.

*   CLI 
*   JetBrains 
*   VS Code 
*   Desktop 
*   Web and mobile 

**During a session**: press `Shift+Tab` to cycle through `default` → `acceptEdits` → `plan` → `auto`. The current mode appears in the status bar. `auto` does not appear in the cycle until you pass `--enable-auto-mode` at startup. Auto also requires a Team (or Enterprise/API once available) plan and Claude Sonnet 4.6 or Opus 4.6, so the option may remain unavailable even with the flag. If `bypassPermissions` is also enabled, it appears in the cycle between `plan` and `auto`.**At startup**: pass the mode as a CLI flag:

Report incorrect code

Copy

Ask AI

```
claude --permission-mode plan
```

**As a default**: set `defaultMode` in your [settings file](https://code.claude.com/docs/en/settings#settings-files):

Report incorrect code

Copy

Ask AI

```
{
  "permissions": {
    "defaultMode": "acceptEdits"
  }
}
```

**Non-interactively**: the same flag works with `-p` for scripted runs:

Report incorrect code

Copy

Ask AI

```
claude -p "refactor auth" --permission-mode acceptEdits
```

`dontAsk` is never in the `Shift+Tab` cycle. `bypassPermissions` appears in the cycle only if you started the session with `--permission-mode bypassPermissions`, `--dangerously-skip-permissions`, or `--allow-dangerously-skip-permissions`. The third flag adds the mode to the cycle without activating it, so you can compose it with a different starting mode like `--permission-mode plan`. Set any of these at startup or in your settings file.

The JetBrains plugin launches Claude Code in the IDE terminal, so switching modes works the same as in the CLI: press `Shift+Tab` to cycle, or pass `--permission-mode` when launching.

**During a session**: click the mode indicator at the bottom of the prompt box to switch modes.**As a default**: set `claudeCode.initialPermissionMode` in VS Code settings, or use the Claude Code extension settings panel.The VS Code UI uses friendly labels that map to the settings keys below:

| UI label | Settings key |
| --- | --- |
| Ask permissions | `default` |
| Auto accept edits | `acceptEdits` |
| Plan mode | `plan` |
| Auto | `auto` |
| Bypass permissions | `bypassPermissions` |

Auto and Bypass permissions appear only after you enable **Allow dangerously skip permissions** in the extension settings. Auto also requires a Team plan and Claude Sonnet 4.6 or Opus 4.6, so the option may remain unavailable even with the toggle on.See the [VS Code guide](https://code.claude.com/docs/en/vs-code) for extension-specific details.

**During a session**: use the mode selector next to the send button. You can change it before or during a session.The Desktop UI uses friendly labels that map to the settings keys below:

| UI label | Settings key |
| --- | --- |
| Ask permissions | `default` |
| Auto accept edits | `acceptEdits` |
| Plan mode | `plan` |
| Auto | `auto` |
| Bypass permissions | `bypassPermissions` |

Auto and Bypass permissions appear in the selector only after you enable them in Desktop settings. See the [Desktop guide](https://code.claude.com/docs/en/desktop#choose-a-permission-mode) for details.

**During a session**: use the mode dropdown next to the prompt box on [claude.ai/code](https://claude.ai/code) or in the Claude mobile app.For [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web) sessions running on Anthropic’s cloud VMs, the dropdown offers Auto accept edits and Plan mode. Ask permissions and Auto are not available for cloud sessions.For [Remote Control](https://code.claude.com/docs/en/remote-control) sessions running on your local machine, the dropdown offers Ask permissions, Auto accept edits, and Plan mode. You can also set the starting mode when you launch the local host:

Report incorrect code

Copy

Ask AI

```
claude remote-control --permission-mode acceptEdits
```

Permission prompts appear in claude.ai for approval.

Permission modes are set through the UI, CLI flags, or settings files. Telling Claude “stop asking for permission” in the chat does not change the mode. See [Permissions](https://code.claude.com/docs/en/permissions) for how modes interact with allow, ask, and deny rules.
## [​](https://code.claude.com/docs/en/permission-modes#available-modes)

Available modes

Each mode makes a different tradeoff between convenience and oversight. Pick the one that matches your task.

| Mode | What Claude can do without asking | Best for |
| --- | --- | --- |
| `default` | Read files | Getting started, sensitive work |
| `acceptEdits` | Read and edit files | Iterating on code you’re reviewing |
| [`plan`](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) | Read files | Exploring a codebase, planning a refactor |
| [`auto`](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode) | All actions, with background safety checks | Long-running tasks, reducing prompt fatigue |
| [`bypassPermissions`](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) | All actions, no checks | Isolated containers and VMs only |
| [`dontAsk`](https://code.claude.com/docs/en/permission-modes#allow-only-pre-approved-tools-with-dontask-mode) | Only pre-approved tools | Locked-down environments |

## [​](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode)

Analyze before you edit with plan mode

Plan mode tells Claude to research and propose changes without making them. Claude reads files, runs shell commands to explore, asks clarifying questions, and writes a plan file, but does not edit your source code. Permission prompts work the same as default mode: you still approve Bash commands, network requests, and other actions that would normally prompt.
### [​](https://code.claude.com/docs/en/permission-modes#when-to-use-plan-mode)

When to use plan mode

Plan mode is useful when you want Claude to research and propose an approach before making changes:
*   **Multi-step implementation**: when a feature requires edits across many files
*   **Code exploration**: when you want to research the codebase before changing anything
*   **Interactive development**: when you want to iterate on the direction with Claude

### [​](https://code.claude.com/docs/en/permission-modes#start-and-use-plan-mode)

Start and use plan mode

Enter plan mode for a single request by prefixing your prompt with `/plan`, or switch the whole session into plan mode by pressing `Shift+Tab` to [cycle through permission modes](https://code.claude.com/docs/en/permission-modes#switch-permission-modes). You can also start in plan mode from the CLI:

Report incorrect code

Copy

Ask AI

```
claude --permission-mode plan
```

This example starts a planning session for a complex refactor:

Report incorrect code

Copy

Ask AI

```
I need to refactor our authentication system to use OAuth2. Create a detailed migration plan.
```

Claude analyzes the current implementation and creates a plan. Refine with follow-ups:

Report incorrect code

Copy

Ask AI

```
What about backward compatibility?
How should we handle database migration?
```

When the plan is ready, Claude presents it and asks how to proceed. From that prompt you can:
*   Approve and start in auto mode
*   Approve and accept edits
*   Approve and manually review each edit
*   Keep planning, which sends your feedback back to Claude for another round

Each approve option also offers to clear the planning context first.
## [​](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode)

Eliminate prompts with auto mode

Auto mode is available on Team plans, with Enterprise and API support rolling out shortly. On Team and Enterprise, an admin must enable it in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code) before users can turn it on. It requires Claude Sonnet 4.6 or Claude Opus 4.6, and is not available on Haiku, claude-3 models, or third-party providers (Bedrock, Vertex, Foundry).Auto mode lets Claude execute actions without showing permission prompts. Before each action runs, a separate classifier model reviews the conversation and decides whether the action matches what you asked for: it blocks actions that escalate beyond the task scope, target infrastructure the classifier doesn’t recognize as trusted, or appear to be driven by hostile content encountered in a file or web page. For a deeper look at how the classifier is designed, see the [auto mode announcement](https://claude.com/blog/auto-mode).

Auto mode is a research preview. It reduces prompts but does not guarantee safety. It provides more protection than `bypassPermissions` but is not as thorough as manually reviewing each action. Use it for tasks where you trust the general direction, not as a replacement for review on sensitive operations.

**Model**: the classifier runs on Claude Sonnet 4.6, even if your main session uses a different model.**Cost**: classifier calls count toward your token usage the same as main-session calls. Each checked action sends a portion of the conversation transcript plus the pending action to the classifier. The extra cost comes mainly from shell commands and network operations, since read-only actions and file edits in your working directory don’t trigger a classifier call.**Latency**: each classifier check adds a round-trip before the action executes.
### [​](https://code.claude.com/docs/en/permission-modes#how-actions-are-evaluated)

How actions are evaluated

Each action goes through a fixed decision order. The first matching step wins:
1.   Actions matching your [allow or deny rules](https://code.claude.com/docs/en/permissions#manage-permissions) resolve immediately
2.   Read-only actions and file edits in your working directory are auto-approved
3.   Everything else goes to the classifier
4.   If the classifier blocks, Claude receives the reason and attempts an alternative approach

On entering auto mode, Claude Code drops any allow rule that is known to grant arbitrary code execution: blanket shell access like `Bash(*)`, wildcarded script interpreters like `Bash(python*)` or `Bash(node*)`, package-manager run commands, and any `Agent` allow rule. These rules would auto-approve the commands and subagent delegations most capable of causing damage before the classifier ever sees them. Narrow rules like `Bash(npm test)` carry over. The dropped rules are restored when you leave auto mode.The classifier receives user messages and tool calls as input, with Claude’s own text and tool results stripped out. It also receives your CLAUDE.md content, so actions described in your project instructions are factored into allow and block decisions. Because tool results never reach the classifier, hostile content in a file or web page cannot manipulate it directly. The classifier evaluates the pending action against a customizable set of block and allow rules, checking whether the action is an overeager escalation beyond what you asked for, a mistake about what’s safe to touch, or a sudden departure from your stated intent that suggests Claude may have been steered by something it read.Unlike your permission rules, which match tool names and argument patterns, the classifier reads prose descriptions of what to block and allow: it reasons about the action in context rather than matching syntax.
### [​](https://code.claude.com/docs/en/permission-modes#how-auto-mode-handles-subagents)

How auto mode handles subagents

When Claude spawns a [subagent](https://code.claude.com/docs/en/sub-agents), the classifier evaluates the delegated task before the subagent starts. A task description that looks dangerous on its own, like “delete all remote branches matching this pattern”, is blocked at spawn time.Inside the subagent, auto mode runs with the same block and allow rules as the parent session. Any `permissionMode` the subagent defines in its own frontmatter is ignored. The subagent’s own tool calls go through the classifier independently.When the subagent finishes, the classifier reviews its full action history. A subagent that was benign at spawn could have been compromised mid-run by content it read. If the return check flags a concern, a security warning is prepended to the subagent’s results so the main agent can decide how to proceed.
### [​](https://code.claude.com/docs/en/permission-modes#what-the-classifier-blocks-by-default)

What the classifier blocks by default

Out of the box, the classifier trusts your working directory and, if you’re in a git repo, that repo’s configured remotes. Everything else is treated as external: your company’s source control orgs, cloud buckets, and internal services are unknown until you tell the classifier about them.**Blocked by default**:
*   Downloading and executing code, like `curl | bash` or scripts from cloned repos
*   Sending sensitive data to external endpoints
*   Production deploys and migrations
*   Mass deletion on cloud storage
*   Granting IAM or repo permissions
*   Modifying shared infrastructure
*   Irreversibly destroying files that existed before the session started
*   Destructive source control operations like force push or pushing directly to `main`

**Allowed by default**:
*   Local file operations in your working directory
*   Installing dependencies already declared in your lock files or manifests
*   Reading `.env` and sending credentials to their matching API
*   Read-only HTTP requests
*   Pushing to the branch you started on or one Claude created

To see the full default rule lists as the classifier receives them, run `claude auto-mode defaults`.If auto mode blocks something routine for your team, like pushing to your own org’s repo or writing to a company bucket, it’s because the classifier doesn’t know those are trusted. Administrators can add trusted repos, buckets, and internal services via the `autoMode.environment` setting: see [Configure the auto mode classifier](https://code.claude.com/docs/en/permissions#configure-the-auto-mode-classifier) for the full configuration guide.
### [​](https://code.claude.com/docs/en/permission-modes#when-auto-mode-falls-back)

When auto mode falls back

The fallback design keeps false positives from derailing a session: a mistaken block costs Claude a retry, not your progress. If the classifier blocks an action 3 times in a row or 20 times total in one session, auto mode pauses and Claude Code resumes prompting for each action. These thresholds are not configurable.
*   **CLI**: you see a notification in the status area. Approving the prompted action resets the denial counters, so you can continue in auto mode
*   **Non-interactive mode** with the `-p` flag: aborts the session, since there is no user to prompt

Repeated blocks usually mean one of two things: the task genuinely requires actions the classifier is built to stop, or the classifier is missing context about your trusted infrastructure and treating safe actions as risky. If the blocks look like false positives, or if the classifier misses something it should have caught, use `/feedback` to report it. If blocks are happening because the classifier doesn’t recognize your repos or services as trusted, have an administrator [configure trusted infrastructure](https://code.claude.com/docs/en/permissions#configure-the-auto-mode-classifier) in managed settings.
## [​](https://code.claude.com/docs/en/permission-modes#allow-only-pre-approved-tools-with-dontask-mode)

Allow only pre-approved tools with dontAsk mode

`dontAsk` mode auto-denies every tool that is not explicitly allowed. Only actions matching your `/permissions` allow rules or `permissions.allow` settings can execute. If a tool has an explicit `ask` rule, the action is also denied rather than prompting. This makes the mode fully non-interactive, suitable for CI pipelines or restricted environments where you pre-define exactly what Claude is permitted to do.

Report incorrect code

Copy

Ask AI

```
claude --permission-mode dontAsk
```

## [​](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode)

Skip all checks with bypassPermissions mode

`bypassPermissions` mode disables all permission prompts and safety checks. Every tool call executes immediately without any verification. Only use this in isolated environments like containers, VMs, or devcontainers without internet access, where Claude Code cannot cause damage to your host system.

Report incorrect code

Copy

Ask AI

```
claude --permission-mode bypassPermissions
```

The `--dangerously-skip-permissions` flag is equivalent to `--permission-mode bypassPermissions`:

Report incorrect code

Copy

Ask AI

```
claude -p "refactor the auth module" --dangerously-skip-permissions
```

`bypassPermissions` mode offers no protection against prompt injection or unintended actions. For a safer alternative that still maintains background safety checks, use [auto mode](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode). Administrators can block this mode by setting `permissions.disableBypassPermissionsMode` to `"disable"` in [managed settings](https://code.claude.com/docs/en/permissions#managed-settings).

## [​](https://code.claude.com/docs/en/permission-modes#compare-permission-approaches)

Compare permission approaches

The table below summarizes the key differences in how each mode handles approvals. `plan` is omitted since it restricts what Claude can do rather than how approvals work.

|  | `default` | `acceptEdits` | `auto` | `dontAsk` | `bypassPermissions` |
| --- | --- | --- | --- | --- | --- |
| Permission prompts | File edits and commands | Commands only | None unless fallback triggers | None, blocked unless pre-allowed | None |
| Safety checks | You review each action | You review commands | Classifier reviews commands | Your pre-approved rules only | None |
| Token usage | Standard | Standard | Higher, from classifier calls | Standard | Standard |

## [​](https://code.claude.com/docs/en/permission-modes#customize-permissions-further)

Customize permissions further

Permission modes set the baseline approval behavior. For control over individual tools or commands, layer additional configuration on top of the active mode.**Permission rules** are the first stop. Add `allow`, `ask`, or `deny` entries to your settings file to pre-approve safe commands, force a prompt for risky ones, or block specific tools entirely. Rules apply in every mode except `bypassPermissions`, which skips the permission layer entirely, and are matched by tool name and argument pattern. See [Manage permissions](https://code.claude.com/docs/en/permissions#manage-permissions) for syntax and examples.**Hooks** cover logic that pattern-matching rules can’t express. A [`PreToolUse` hook](https://code.claude.com/docs/en/hooks#pretooluse-decision-control) runs before every tool call and can allow, deny, or escalate based on command content, file paths, time of day, or a response from an external policy service. A [`PermissionRequest` hook](https://code.claude.com/docs/en/hooks#permissionrequest) intercepts the permission dialog itself and answers on your behalf. See [Hooks](https://code.claude.com/docs/en/hooks) for configuration.
## [​](https://code.claude.com/docs/en/permission-modes#see-also)

See also

*   [Permissions](https://code.claude.com/docs/en/permissions): permission rules, syntax, managed policies
*   [Hooks](https://code.claude.com/docs/en/hooks): custom permission logic, lifecycle scripting
*   [Security](https://code.claude.com/docs/en/security): security safeguards and best practices
*   [Sandboxing](https://code.claude.com/docs/en/sandboxing): filesystem and network isolation for Bash commands
*   [Non-interactive mode](https://code.claude.com/docs/en/headless): run Claude Code programmatically with the `-p` flag

Was this page helpful?

Yes No

[Store instructions and memories](https://code.claude.com/docs/en/memory)[Common workflows](https://code.claude.com/docs/en/common-workflows)

⌘I

[Claude Code Docs home page![Image 4: light logo](https://mintcdn.com/claude-code/c5r9_6tjPMzFdDDT/logo/light.svg?fit=max&auto=format&n=c5r9_6tjPMzFdDDT&q=85&s=78fd01ff4f4340295a4f66e2ea54903c)![Image 5: dark logo](https://mintcdn.com/claude-code/c5r9_6tjPMzFdDDT/logo/dark.svg?fit=max&auto=format&n=c5r9_6tjPMzFdDDT&q=85&s=1298a0c3b3a1da603b190d0de0e31712)](https://code.claude.com/docs/en/overview)

[x](https://x.com/AnthropicAI)[linkedin](https://www.linkedin.com/company/anthropicresearch)

Company

[Anthropic](https://www.anthropic.com/company)[Careers](https://www.anthropic.com/careers)[Economic Futures](https://www.anthropic.com/economic-futures)[Research](https://www.anthropic.com/research)[News](https://www.anthropic.com/news)[Trust center](https://trust.anthropic.com/)[Transparency](https://www.anthropic.com/transparency)

Help and security

[Availability](https://www.anthropic.com/supported-countries)[Status](https://status.anthropic.com/)[Support center](https://support.claude.com/)

Learn

[Courses](https://www.anthropic.com/learn)[MCP connectors](https://claude.com/partners/mcp)[Customer stories](https://www.claude.com/customers)[Engineering blog](https://www.anthropic.com/engineering)[Events](https://www.anthropic.com/events)[Powered by Claude](https://claude.com/partners/powered-by-claude)[Service partners](https://claude.com/partners/services)[Startups program](https://claude.com/programs/startups)

Terms and policies

[Privacy choices](https://code.claude.com/docs/en/permission-modes#)[Privacy policy](https://www.anthropic.com/legal/privacy)[Disclosure policy](https://www.anthropic.com/responsible-disclosure-policy)[Usage policy](https://www.anthropic.com/legal/aup)[Commercial terms](https://www.anthropic.com/legal/commercial-terms)[Consumer terms](https://www.anthropic.com/legal/consumer-terms)

Assistant

Responses are generated using AI and may contain mistakes.