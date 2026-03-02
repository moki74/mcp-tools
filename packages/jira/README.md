# @berthojoris/mcp-jira-server

> **Coming soon.** This package is a placeholder for the Jira MCP server.

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for Jira integration.

## Planned Features

- Browse projects, boards, and sprints
- Read and create issues
- Search with JQL
- Manage issue transitions and comments

## Usage (planned)

```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "@berthojoris/mcp-jira-server", "https://yourorg.atlassian.net"],
      "type": "stdio"
    }
  }
}
```
