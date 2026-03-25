# Settings precedence

Settings apply in order of precedence. From highest to lowest:

1.   **Managed settings** ([server-managed](https://code.claude.com/docs/en/server-managed-settings), [MDM/OS-level policies](https://code.claude.com/docs/en/settings#configuration-scopes), or [managed settings](https://code.claude.com/docs/en/settings#settings-files))
    *   Policies deployed by IT through server delivery, MDM configuration profiles, registry policies, or managed settings files
    *   Cannot be overridden by any other level, including command line arguments
    *   Within the managed tier, precedence is: server-managed > MDM/OS-level policies >`managed-settings.json`> HKCU registry (Windows only). Only one managed source is used; sources do not merge.

2.   **Command line arguments**
    *   Temporary overrides for a specific session

3.   **Local project settings** (`.claude/settings.local.json`)
    *   Personal project-specific settings

4.   **Shared project settings** (`.claude/settings.json`)
    *   Team-shared project settings in source control

5.   **User settings** (`~/.claude/settings.json`)
    *   Personal global settings

This hierarchy ensures that organizational policies are always enforced while still allowing teams and individuals to customize their experience. The same precedence applies whether you run Claude Code from the CLI, the [VS Code extension](https://code.claude.com/docs/en/vs-code), or a [JetBrains IDE](https://code.claude.com/docs/en/jetbrains).For example, if your user settings allow `Bash(npm run *)` but a project’s shared settings deny it, the project setting takes precedence and the command is blocked.

### Verify active settings

Run `/status` inside Claude Code to see which settings sources are active and where they come from. The output shows each configuration layer (managed, user, project) along with its origin, such as `Enterprise managed settings (remote)`, `Enterprise managed settings (plist)`, `Enterprise managed settings (HKLM)`, or `Enterprise managed settings (file)`. If a settings file contains errors, `/status` reports the issue so you can fix it.

### Key points about the configuration system

*   **Memory files (`CLAUDE.md`)**: Contain instructions and context that Claude loads at startup
*   **Settings files (JSON)**: Configure permissions, environment variables, and tool behavior
*   **Skills**: Custom prompts that can be invoked with `/skill-name` or loaded by Claude automatically
*   **MCP servers**: Extend Claude Code with additional tools and integrations
*   **Precedence**: Higher-level configurations (Managed) override lower-level ones (User/Project)
*   **Inheritance**: Settings are merged, with more specific settings adding to or overriding broader ones

### System prompt

Claude Code’s internal system prompt is not published. To add custom instructions, use `CLAUDE.md` files or the `--append-system-prompt` flag.

### Excluding sensitive files

To prevent Claude Code from accessing files containing sensitive information like API keys, secrets, and environment files, use the `permissions.deny` setting in your `.claude/settings.json` file:

```
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)",
      "Read(./build)"
    ]
  }
}
```

This replaces the deprecated `ignorePatterns` configuration. Files matching these patterns are excluded from file discovery and search results, and read operations on these files are denied.

## Subagent configuration

Claude Code supports custom AI subagents that can be configured at both user and project levels. These subagents are stored as Markdown files with YAML frontmatter:

*   **User subagents**: `~/.claude/agents/` - Available across all your projects
*   **Project subagents**: `.claude/agents/` - Specific to your project and can be shared with your team

Subagent files define specialized AI assistants with custom prompts and tool permissions. Learn more about creating and using subagents in the [subagents documentation](https://code.claude.com/docs/en/sub-agents).

## Plugin configuration

Claude Code supports a plugin system that lets you extend functionality with skills, agents, hooks, and MCP servers. Plugins are distributed through marketplaces and can be configured at both user and repository levels.

### Plugin settings

Plugin-related settings in `settings.json`:

```
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "deployer@acme-tools": true,
    "analyzer@security-plugins": false
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": "github",
      "repo": "acme-corp/claude-plugins"
    }
  }
}
```

#### `enabledPlugins`

Controls which plugins are enabled. Format: `"plugin-name@marketplace-name": true/false`**Scopes**:

*   **User settings** (`~/.claude/settings.json`): Personal plugin preferences
*   **Project settings** (`.claude/settings.json`): Project-specific plugins shared with team
*   **Local settings** (`.claude/settings.local.json`): Per-machine overrides (not committed)

**Example**:

```
{
  "enabledPlugins": {
    "code-formatter@team-tools": true,
    "deployment-tools@team-tools": true,
    "experimental-features@personal": false
  }
}
```

Defines additional marketplaces that should be made available for the repository. Typically used in repository-level settings to ensure team members have access to required plugin sources.**When a repository includes `extraKnownMarketplaces`**:

1.   Team members are prompted to install the marketplace when they trust the folder
2.   Team members are then prompted to install plugins from that marketplace
3.   Users can skip unwanted marketplaces or plugins (stored in user settings)
4.   Installation respects trust boundaries and requires explicit consent

**Example**:

```
{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/claude-plugins"
      }
    },
    "security-plugins": {
      "source": {
        "source": "git",
        "url": "https://git.example.com/security/plugins.git"
      }
    }
  }
}
```

**Marketplace source types**:

*   `github`: GitHub repository (uses `repo`)
*   `git`: Any git URL (uses `url`)
*   `directory`: Local filesystem path (uses `path`, for development only)
*   `hostPattern`: regex pattern to match marketplace hosts (uses `hostPattern`)
*   `settings`: inline marketplace declared directly in settings.json without a separate hosted repository (uses `name` and `plugins`)

Use `source: 'settings'` to declare a small set of plugins inline without setting up a hosted marketplace repository. Plugins listed here must reference external sources such as GitHub or npm. You still need to enable each plugin separately in `enabledPlugins`.

```
{
  "extraKnownMarketplaces": {
    "team-tools": {
      "source": {
        "source": "settings",
        "name": "team-tools",
        "plugins": [
          {
            "name": "code-formatter",
            "source": {
              "source": "github",
              "repo": "acme-corp/code-formatter"
            }
          }
        ]
      }
    }
  }
}
```

#### `strictKnownMarketplaces`

**Managed settings only**: Controls which plugin marketplaces users are allowed to add. This setting can only be configured in [managed settings](https://code.claude.com/docs/en/settings#settings-files) and provides administrators with strict control over marketplace sources.**Managed settings file locations**:

*   **macOS**: `/Library/Application Support/ClaudeCode/managed-settings.json`
*   **Linux and WSL**: `/etc/claude-code/managed-settings.json`
*   **Windows**: `C:\Program Files\ClaudeCode\managed-settings.json`

**Key characteristics**:

*   Only available in managed settings (`managed-settings.json`)
*   Cannot be overridden by user or project settings (highest precedence)
*   Enforced BEFORE network/filesystem operations (blocked sources never execute)
*   Uses exact matching for source specifications (including `ref`, `path` for git sources), except `hostPattern`, which uses regex matching

**Allowlist behavior**:

*   `undefined` (default): No restrictions - users can add any marketplace
*   Empty array `[]`: Complete lockdown - users cannot add any new marketplaces
*   List of sources: Users can only add marketplaces that match exactly

**All supported source types**:The allowlist supports multiple marketplace source types. Most sources use exact matching, while `hostPattern` uses regex matching against the marketplace host.

1.   **GitHub repositories**:

```
{ "source": "github", "repo": "acme-corp/approved-plugins" }
{ "source": "github", "repo": "acme-corp/security-tools", "ref": "v2.0" }
{ "source": "github", "repo": "acme-corp/plugins", "ref": "main", "path": "marketplace" }
```

Fields: `repo` (required), `ref` (optional: branch/tag/SHA), `path` (optional: subdirectory)

1.   **Git repositories**:

```
{ "source": "git", "url": "https://gitlab.example.com/tools/plugins.git" }
{ "source": "git", "url": "https://bitbucket.org/acme-corp/plugins.git", "ref": "production" }
{ "source": "git", "url": "ssh://git@git.example.com/plugins.git", "ref": "v3.1", "path": "approved" }
```

Fields: `url` (required), `ref` (optional: branch/tag/SHA), `path` (optional: subdirectory)

1.   **URL-based marketplaces**:

```
{ "source": "url", "url": "https://plugins.example.com/marketplace.json" }
{ "source": "url", "url": "https://cdn.example.com/marketplace.json", "headers": { "Authorization": "Bearer ${TOKEN}" } }
```

Fields: `url` (required), `headers` (optional: HTTP headers for authenticated access)

1.   **NPM packages**:

```
{ "source": "npm", "package": "@acme-corp/claude-plugins" }
{ "source": "npm", "package": "@acme-corp/approved-marketplace" }
```

Fields: `package` (required, supports scoped packages)

1.   **File paths**:

```
{ "source": "file", "path": "/usr/local/share/claude/acme-marketplace.json" }
{ "source": "file", "path": "/opt/acme-corp/plugins/marketplace.json" }
```

Fields: `path` (required: absolute path to marketplace.json file)

1.   **Directory paths**:

```
{ "source": "directory", "path": "/usr/local/share/claude/acme-plugins" }
{ "source": "directory", "path": "/opt/acme-corp/approved-marketplaces" }
```

Fields: `path` (required: absolute path to directory containing `.claude-plugin/marketplace.json`)

1.   **Host pattern matching**:

```
{ "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
{ "source": "hostPattern", "hostPattern": "^gitlab\\.internal\\.example\\.com$" }
```

Fields: `hostPattern` (required: regex pattern to match against the marketplace host)Use host pattern matching when you want to allow all marketplaces from a specific host without enumerating each repository individually. This is useful for organizations with internal GitHub Enterprise or GitLab servers where developers create their own marketplaces.Host extraction by source type:

*   `github`: always matches against `github.com`
*   `git`: extracts hostname from the URL (supports both HTTPS and SSH formats)
*   `url`: extracts hostname from the URL
*   `npm`, `file`, `directory`: not supported for host pattern matching

**Configuration examples**:Example: allow specific marketplaces only:

```
{
  "strictKnownMarketplaces": [
    {
      "source": "github",
      "repo": "acme-corp/approved-plugins"
    },
    {
      "source": "github",
      "repo": "acme-corp/security-tools",
      "ref": "v2.0"
    },
    {
      "source": "url",
      "url": "https://plugins.example.com/marketplace.json"
    },
    {
      "source": "npm",
      "package": "@acme-corp/compliance-plugins"
    }
  ]
}
```

Example - Disable all marketplace additions:

```
{
  "strictKnownMarketplaces": []
}
```

Example: allow all marketplaces from an internal git server:

```
{
  "strictKnownMarketplaces": [
    {
      "source": "hostPattern",
      "hostPattern": "^github\\.example\\.com$"
    }
  ]
}
```

**Exact matching requirements**:Marketplace sources must match **exactly** for a user’s addition to be allowed. For git-based sources (`github` and `git`), this includes all optional fields:

*   The `repo` or `url` must match exactly
*   The `ref` field must match exactly (or both be undefined)
*   The `path` field must match exactly (or both be undefined)

Examples of sources that **do NOT match**:

```
// These are DIFFERENT sources:
{ "source": "github", "repo": "acme-corp/plugins" }
{ "source": "github", "repo": "acme-corp/plugins", "ref": "main" }

// These are also DIFFERENT:
{ "source": "github", "repo": "acme-corp/plugins", "path": "marketplace" }
{ "source": "github", "repo": "acme-corp/plugins" }
```

**Comparison with `extraKnownMarketplaces`**:

| Aspect | `strictKnownMarketplaces` | `extraKnownMarketplaces` |
| --- | --- | --- |
| **Purpose** | Organizational policy enforcement | Team convenience |
| **Settings file** | `managed-settings.json` only | Any settings file |
| **Behavior** | Blocks non-allowlisted additions | Auto-installs missing marketplaces |
| **When enforced** | Before network/filesystem operations | After user trust prompt |
| **Can be overridden** | No (highest precedence) | Yes (by higher precedence settings) |
| **Source format** | Direct source object | Named marketplace with nested source |
| **Use case** | Compliance, security restrictions | Onboarding, standardization |

**Format difference**:`strictKnownMarketplaces` uses direct source objects:

```
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/plugins" }
  ]
}
```

`extraKnownMarketplaces` requires named marketplaces:

```
{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": { "source": "github", "repo": "acme-corp/plugins" }
    }
  }
}
```

**Using both together**:`strictKnownMarketplaces` is a policy gate: it controls what users may add but does not register any marketplaces. To both restrict and pre-register a marketplace for all users, set both in `managed-settings.json`:

```
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/plugins" }
  ],
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": { "source": "github", "repo": "acme-corp/plugins" }
    }
  }
}
```

With only `strictKnownMarketplaces` set, users can still add the allowed marketplace manually via `/plugin marketplace add`, but it is not available automatically.**Important notes**:

*   Restrictions are checked BEFORE any network requests or filesystem operations
*   When blocked, users see clear error messages indicating the source is blocked by managed policy
*   The restriction applies only to adding NEW marketplaces; previously installed marketplaces remain accessible
*   Managed settings have the highest precedence and cannot be overridden

See [Managed marketplace restrictions](https://code.claude.com/docs/en/plugin-marketplaces#managed-marketplace-restrictions) for user-facing documentation.

### Managing plugins

Use the `/plugin` command to manage plugins interactively:

*   Browse available plugins from marketplaces
*   Install/uninstall plugins
*   Enable/disable plugins
*   View plugin details (commands, agents, hooks provided)
*   Add/remove marketplaces

Learn more about the plugin system in the [plugins documentation](https://code.claude.com/docs/en/plugins).

## Environment variables

Environment variables let you control Claude Code behavior without editing settings files. Any variable can also be configured in [`settings.json`](https://code.claude.com/docs/en/settings#available-settings) under the `env` key to apply it to every session or roll it out to your team.See the [environment variables reference](https://code.claude.com/docs/en/env-vars) for the full list.

## Tools available to Claude

Claude Code has access to a set of tools for reading, editing, searching, running commands, and orchestrating subagents. Tool names are the exact strings you use in permission rules and hook matchers.See the [tools reference](https://code.claude.com/docs/en/tools-reference) for the full list and Bash tool behavior details.

## See also

*   [Permissions](https://code.claude.com/docs/en/permissions): permission system, rule syntax, tool-specific patterns, and managed policies
*   [Authentication](https://code.claude.com/docs/en/authentication): set up user access to Claude Code
*   [Troubleshooting](https://code.claude.com/docs/en/troubleshooting): solutions for common configuration issues