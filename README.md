# mcp-tools

A monorepo of [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [packages/mysql](./packages/mysql) | MySQL MCP server | `npx @berthojoris/mcp-mysql-server` |
| [packages/jira](./packages/jira) | Jira MCP server *(coming soon)* | — |

## Getting Started

Install all workspace dependencies from the root:

```bash
npm install
```

Build all packages:

```bash
npm run build
```

Build a single package:

```bash
npm run build --workspace=packages/mysql
```

## Adding a New MCP Server

1. Create `packages/<name>/` with its own `package.json`, `tsconfig.json`, `src/`, and `bin/`
2. Extend the shared root tsconfig: `"extends": "../../tsconfig.json"`
3. Run `npm install` from the root to link the workspace

## Structure

```
mcp-tools/
├── package.json          # Workspace root (npm workspaces)
├── tsconfig.json         # Shared TypeScript base config
├── eslint.config.js      # Shared ESLint config
└── packages/
    ├── mysql/            # @berthojoris/mcp-mysql-server
    └── jira/             # @berthojoris/mcp-jira-server (coming soon)
```

## License

MIT
