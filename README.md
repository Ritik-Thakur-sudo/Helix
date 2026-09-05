# Helix

> A terminal-first AI coding agent that brings AI-powered development directly into your project.

Helix is a developer-focused AI coding platform built around a simple idea:

**The AI should understand your project, while your project stays on your machine.**

Helix combines a terminal-native interface with remote AI infrastructure and client-side development tools. The CLI runs locally, executes project tools locally, and communicates with the Helix backend for AI inference, authentication, session persistence, and usage billing.

---

## 🚀 V1 Status

**Helix V1 is complete.**

V1 focuses on delivering the complete core coding-agent loop:

```text
Run Helix
    ↓
Authenticate
    ↓
Create / Resume a Session
    ↓
Choose Plan or Build Mode
    ↓
Talk to an AI Model
    ↓
Inspect the Local Project
    ↓
Modify the Local Project
```

The current V1 foundation is intentionally focused on making this workflow work reliably before expanding into deeper security, distribution, and agent capabilities.

## ✨ Features

### 🖥️ Terminal-First Experience

Helix is designed to live inside the developer's terminal rather than replacing the development environment.

- React-powered terminal UI
- OpenTUI rendering
- Keyboard-driven workflows
- Command menu
- Toast notifications
- Multiple themes
- Persistent UI preferences
- Session history

### 🧠 AI Coding Agent

Helix connects the terminal experience to remote AI models through the Helix backend.

- Streaming AI responses
- Tool calling
- Model switching
- Conversation history
- Persistent sessions
- Session resume
- Standard AI SDK UIMessage streaming
- Multi-step tool execution

The architecture separates the AI platform from the local project environment.

### 🗺️ Plan Mode

Plan Mode provides a read-only environment for understanding and reasoning about a project.

Available capabilities include:

- Read files
- List directories
- Search files with glob patterns
- Search source code with grep
- Analyze project structure
- Reason about implementation approaches

Plan Mode intentionally does not expose file modification or shell execution tools.

### 🛠️ Build Mode

Build Mode extends Plan Mode with development capabilities.

The AI can:

- Read files
- Create files
- Edit files
- Search the project
- Run shell commands
- Iterate through tool calls
- Inspect the result of its changes

This allows Helix to move from:

**Understand → Plan → Implement → Verify**

### 🔧 Client-Side Tool Execution

One of the most important architectural decisions in Helix V1 is that project tools execute on the developer's machine.

The backend does not need direct access to the developer's filesystem.

```text
┌───────────────────────────────┐
│       Developer Machine       │
│                               │
│  ┌─────────────────────────┐  │
│  │       Helix CLI         │  │
│  │                         │  │
│  │  OpenTUI / React        │  │
│  │  AI SDK Client          │  │
│  │  Local Tool Executor    │  │
│  └────────────┬────────────┘  │
│               │               │
│               ▼               │
│        Developer Project      │
│                               │
└───────────────┬───────────────┘
                │
                │ UIMessage Stream
                ▼
┌────────────────────────────────┐
│        Helix Backend           │
│                                │
│  Hono                          │
│  AI / Model Providers          │
│  Authentication                │
│  Sessions                      │
│  Billing                       │
│  Usage Tracking                │
└────────────────┬───────────────┘
                 │
                 ▼
          Neon / PostgreSQL
```

The result is a clear separation of responsibilities:

**Local machine**
- Project files
- File operations
- Shell execution
- CLI interface
- Tool execution

**Helix backend**
- AI inference
- Authentication
- Session persistence
- Billing
- Usage tracking

### 🧰 Local Development Tools

Helix V1 provides the AI with the following project tools:

| Tool            | Purpose                           |
| --------------- | --------------------------------- |
| `readFile`      | Read a project file               |
| `writeFile`     | Create or overwrite a file        |
| `editFile`      | Perform an exact text replacement |
| `listDirectory` | Inspect directory contents        |
| `glob`          | Find files using glob patterns    |
| `grep`          | Search project contents           |
| `bash`          | Execute shell commands            |

All project paths are resolved relative to the directory where Helix is running.

### 🔐 Authentication

Helix V1 currently uses Clerk for authentication.

The CLI provides browser-based authentication through:

```text
/login
```

Authentication flow:

```text
Helix CLI
    ↓
Open browser
    ↓
Clerk OAuth
    ↓
Local callback
    ↓
Access token
    ↓
Helix CLI
    ↓
Authenticated API requests
```

Authentication is intentionally isolated behind the application's auth layer so the implementation can evolve independently in future versions.

### 💳 Usage & Billing

Helix uses a credit-based usage model powered by Polar.

The V1 billing flow includes:

- Credit balance checks
- Checkout
- Customer portal
- AI usage tracking
- Token-based usage calculation
- Credit ingestion
- Insufficient-credit protection

Available commands include:

```text
/upgrade
/usage
```

The billing architecture is designed so AI usage can be translated into Helix credits based on the selected model and provider.

### ☁️ Backend Infrastructure

The Helix backend is deployed independently from the CLI.

Current infrastructure:

| Layer            | Technology            |
| ---------------- | ---------------------- |
| CLI              | Bun + OpenTUI + React  |
| Backend          | Hono                   |
| AI               | Vercel AI SDK          |
| Database         | Prisma                 |
| Database Hosting | Neon / PostgreSQL      |
| Authentication   | Clerk                  |
| Billing          | Polar                  |
| Error Monitoring | Sentry                 |
| Deployment       | Railway                |

The CLI remains a local application while the backend provides the remote platform services.

## 🏗️ Architecture

```text
                         HELIX V1
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      Developer Machine               Cloud Backend
             │                             │
      ┌──────┴──────┐              ┌───────┴────────┐
      │             │              │                │
      ▼             ▼              ▼                ▼
   Helix CLI    Local Tools      Hono API       AI Models
      │             │              │                │
      │             └──────┐       │                │
      │                    │       ▼                │
      │                    │   Authentication       │
      │                    │   Sessions             │
      │                    │   Billing              │
      │                    │   Usage                │
      │                    │       │                │
      └──────── UIMessage ─┴───────┴────────────────┘
                                  │
                                  ▼
                           Neon / PostgreSQL
```

**Core architectural boundary**

```text
              LOCAL                         REMOTE

       ┌─────────────────┐          ┌─────────────────┐
       │ Project Files   │          │ AI Inference    │
       │ File Tools      │          │ Authentication  │
       │ Shell           │◄────────►│ Sessions        │
       │ CLI UI          │  Stream  │ Billing         │
       └─────────────────┘          │ Persistence     │
                                     └─────────────────┘
```

This boundary is central to Helix's V1 architecture.

## 📁 Project Structure

```text
Helix/
│
├── packages/
│   │
│   ├── cli/
│   │   ├── bin/
│   │   │   └── helix
│   │   └── src/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/
│   │       └── ...
│   │
│   ├── server/
│   │   └── src/
│   │       ├── routes/
│   │       ├── middleware/
│   │       ├── lib/
│   │       └── ...
│   │
│   ├── shared/
│   │   └── src/
│   │       └── schemas.ts
│   │
│   └── database/
│       ├── prisma/
│       └── generated/
│
├── package.json
├── bun.lock
└── README.md
```

### Package responsibilities

**`packages/cli`**
Terminal application, UI, authentication client, local tool execution, and AI SDK client.

**`packages/server`**
Hono API, AI streaming, model resolution, authentication middleware, sessions, usage tracking, and billing.

**`packages/shared`**
Shared schemas, modes, model definitions, and tool contracts used across packages.

**`packages/database`**
Prisma configuration and database access layer.

## 🧪 Development

### Requirements

- Bun
- PostgreSQL / Neon database
- Configured AI provider credentials
- Clerk credentials
- Polar configuration
- Sentry configuration

### Clone the repository

```bash
git clone https://github.com/Ritik-Thakur-sudo/Helix.git
cd Helix
```

### Install dependencies

```bash
bun install
```

### Environment Configuration

Create a local environment file based on the project's environment example and configure the required services.

The application uses environment variables for:

```text
API_URL
DATABASE_URL

GOOGLE_GENERATIVE_AI_API_KEY
GROQ_API_KEY

CLERK_OAUTH_CLIENT_ID
CLERK_OAUTH_CLIENT_SECRET
CLERK_FRONTEND_API
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY

POLAR_ACCESS_TOKEN
POLAR_CREDITS_METER_ID

SENTRY_DSN
```

Use the actual environment configuration required by the current deployment when running the complete platform.

## ▶️ Run Helix Locally

### Start the CLI

```bash
bun run dev:cli
```

### Start the backend

```bash
bun run dev:server
```

## 📦 Build the CLI

Build the CLI executable bundle:

```bash
bun run build:cli
```

The CLI build externalizes OpenTUI's platform-specific native packages so the Bun bundler does not attempt to resolve native variants for unsupported platforms during the build.

## 🔗 Use `helix` as a Command

Register the local CLI:

```bash
bun run link:cli
```

After linking, Helix can be launched from a project directory with:

```bash
helix
```

For example:

```bash
cd my-project
helix
```

Helix will operate against the project directory in which it is launched.

## 💬 Example Workflow

A typical Helix session looks like:

```text
$ cd my-project

$ helix

┌─────────────────────────────────────┐
│              HELIX                  │
│                                     │
│  AI-powered development in your    │
│  terminal.                         │
└─────────────────────────────────────┘

> /login

Signed in

> Analyze the architecture of this project

AI:
  ├─ listDirectory
  ├─ glob
  ├─ readFile
  └─ grep

> Plan how we should add authentication

[Plan Mode]

AI:
  ...implementation plan...

> Switch to Build Mode

> Implement the authentication system

AI:
  ├─ readFile
  ├─ editFile
  ├─ writeFile
  ├─ bash
  └─ verify changes
```

## 🎯 Design Principles

**Local-first project interaction**
The developer's project remains on the developer's machine while Helix provides the intelligence layer remotely.

**Terminal-native**
Helix is designed around the terminal instead of treating the terminal as an afterthought.

**Explicit modes**
Plan and Build modes provide a clear distinction between reasoning and modification.

**Shared contracts**
Tool schemas and application types are shared between the CLI and backend to reduce mismatches.

**Incremental evolution**
Helix is being developed as an evolving platform rather than a single-purpose prototype.

## 🛣️ Roadmap

### V1 — Complete

- [x] Terminal-first CLI
- [x] OpenTUI interface
- [x] React-based terminal UI
- [x] Themes
- [x] Sessions
- [x] Session persistence
- [x] Session resume
- [x] AI streaming
- [x] Tool calling
- [x] Plan Mode
- [x] Build Mode
- [x] Client-side tools
- [x] Local filesystem access
- [x] Shell execution
- [x] Clerk authentication
- [x] Polar billing
- [x] Usage tracking
- [x] Sentry
- [x] Railway deployment
- [x] `helix` CLI command
- [x] CLI build and linking foundation

### V2 — Planned

V2 will focus on turning the V1 foundation into a more robust and broadly distributable developer platform.

Planned areas include:

- [ ] Secure sandboxing
- [ ] Stronger filesystem isolation
- [ ] Symlink protection
- [ ] Tool permissions and approvals
- [ ] Safer shell execution
- [ ] Cross-platform shell support
- [ ] Resource and execution limits
- [ ] Improved interruption and resume behavior
- [ ] Production-grade authentication
- [ ] Git integration
- [ ] GitHub Releases
- [ ] Installers and distribution
- [ ] Automatic updates
- [ ] Expanded agent capabilities
- [ ] Additional developer workflows

V2 is intentionally outside the current V1 scope.

## 🔭 Vision

Helix is being built toward a larger idea:

> A development environment where an AI agent can understand, plan, build, test, and evolve software alongside the developer—without taking ownership of the developer's machine away from them.

The long-term goal is not simply to make another chatbot that writes code.

It is to build a developer-native AI engineering system that lives where software development already happens: **the terminal**.

## 📊 Current State

```text
                    HELIX

        ┌────────────────────────────┐
        │      Terminal Client       │
        │                            │
        │  AI · Plan · Build · Tools │
        └──────────────┬─────────────┘
                       │
                 UIMessage Stream
                       │
        ┌──────────────▼─────────────┐
        │       Helix Backend        │
        │                            │
        │ AI · Auth · Sessions       │
        │ Billing · Usage · Sentry   │
        └──────────────┬─────────────┘
                       │
                       ▼
                 PostgreSQL
```

- **V1**: Working product foundation
- **V2**: Robust, secure, distributable platform

## 🤝 Contributing

Helix is an evolving project.

Issues, ideas, architectural discussions, and contributions are welcome as the project continues to grow.

If you find a bug or have an idea for improving Helix, open an issue or start a discussion in the repository.

---

<p align="center">
Built with Bun, OpenTUI, Hono, the Vercel AI SDK, Prisma, Neon, Clerk, Polar, and Sentry.
</p>
