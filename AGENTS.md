# AGENTS Development Guidelines

- This project uses MCP MySQL with the latest version of Node.js.
- When creating a new feature:
  - Update both `README.md` and `DOCUMENTATIONS.md` with the feature details.
  - Increment the version number in `package.json` after the task is completed.
- Always update `CHANGELOG.md` for each new feature and increment the version number upon completion.
- Any temporary test file created during development must be removed after the test is completed.
- Before publishing to npmjs, ensure the `dist-tag` is set to `latest` for the current version.