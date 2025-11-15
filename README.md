# Multi-Project Repository

This repository contains multiple independent projects, each in its own branch.

## Repository Structure

This main branch is intentionally kept minimal. Each project lives in its own dedicated branch:

- **numeroesim-communication-plans** - Communication plans display application (Numeroesim)
- **claude/dental-booking-agent-mvp-...** - Dental booking system with AI agent and WhatsApp integration
- **nimro-clean-v2** - Clean version of Nimro project

## Working with Projects

### Starting a New Project

Claude Code automatically creates a new branch for each project when you start working on it.

### Switching Between Projects

```bash
# List all branches
git branch -a

# Switch to a specific project
git checkout <branch-name>
```

### Project Guidelines

Each project branch should:
- Be self-contained with its own dependencies
- Include its own README with project-specific documentation
- Follow the coding standards defined in CLAUDE.md
- Include necessary configuration files (.env.example, docker-compose, etc.)

## Development Tools

Projects in this repository are built using:
- Claude Code (https://claude.ai/code)
- Various frameworks: Python/FastAPI, Next.js, Node.js/TypeScript
- AI/ML tools: OpenAI, LangGraph, ChromaDB
- iOS development: Swift, Linphone

## Global Configuration

See [CLAUDE.md](./CLAUDE.md) for:
- Development guidelines
- Common commands
- Project structure patterns
- Best practices

## Notes

- Main branch contains only this README and global configuration
- Each project maintains its own version history in its branch
- No cross-project dependencies should exist
