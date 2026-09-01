# CodeForge C — Production Architecture & Development Guide

CodeForge C is a full-stack, browser-based C programming IDE, interactive learning platform, automated challenge judge, and AI-assisted compiler workbench.

---

## 12-Phase Development Architecture

### Phase 1: Frontend IDE
- **Monaco Editor Integration**: Full C syntax highlighting, bracket matching, autocomplete, line numbers, minimap, and error squiggle decorations.
- **Multi-Tab File Management**: Open, switch, close, and edit multiple `.c` and `.h` files with dirty-state tracking.
- **High-Density Theme**: Developer-grade interface with `#010409` canvas, `#0d1117` containers, `#161b22` panels, and `#30363d` hairline borders.
- **Customizable Editor Settings**: Font size, tab spacing, word wrap, cursor blinking, minimap toggling, and auto-save timer.

### Phase 2: Backend Architecture
- **Express.js API Layer**: REST endpoints mounted at `/api` for compilation (`/api/compile`), execution (`/api/run`), AI analysis (`/api/ai/analyze`), challenges (`/api/challenges`), and test validation (`/api/challenges/test`).
- **Unified TypeScript Contracts**: Shared type definitions in `/shared/types.ts` guaranteeing strict typing between backend services and frontend components.

### Phase 3: GCC Compilation & Diagnostics
- **Direct GCC Toolchain Integration**: Compiles standard C (`-std=c99`, `-std=c11`, `-std=c17`) with optimization levels (`-O0`, `-O1`, `-O2`, `-O3`), math library linking (`-lm`), and POSIX threads (`-pthread`).
- **Structured Diagnostic Parser**: Converts GCC compiler output (`file.c:line:col: error/warning: message`) into structured Monaco problem items and jump-to-source actions.

### Phase 4: Sandbox & Security Architecture
- **Isolated Ephemeral Workspaces**: Each compilation runs inside a unique, restricted directory (`/tmp/codeforge-c-sandboxes/sandbox_<timestamp>_<hash>`) created with restrictive permissions (`0700`).
- **Resource Limits & Guards**:
  - Process Timeout: 5-second hard limit (`SIGKILL` termination to stop infinite loops).
  - Buffer Limits: 512 KB maximum stdout/stderr buffer to prevent memory exhaustion attacks.
  - Memory Caps: 64MB virtual memory boundary.
  - Sanitized Environment: Strips all server API keys and sensitive tokens before spawning child processes.
  - Path Traversal Protection: Strips `..` path segments to prevent directory breakout.
- **Immediate Cleanup**: Workspaces and binaries are destroyed immediately upon execution completion in a `finally` block.

### Phase 5: Projects & Persistence
- **Local & Cloud Storage**: Multi-file project management with automated localStorage sync and project switching.
- **Preloaded Templates**: Hello World, Pointer Swap, Dynamic Memory Allocation, Singly Linked List, and Matrix Operations.
- **Import / Export**: Full JSON project export and import capability for offline archiving.

### Phase 6: AI Assistant (ForgeAI C-Tutor)
- **Gemini AI Integration**: Server-side proxy calling Gemini via the `@google/genai` SDK with secure key management.
- **Specialized Systems Modes**:
  - **Explain**: Step-by-step logic, pointer breakdowns, and Big-O complexity analysis.
  - **Debug & Fix**: Root-cause analysis with one-click code replacement.
  - **Optimize**: Memory safety checks, leak prevention, and cache-friendly refactorings.
  - **Test Cases**: Automatic edge and stress test generation.
  - **Error Explainer**: Natural language translation of GCC compiler errors and segmentation faults.

### Phase 7: Interactive Learning Section
- **7 Structured C Modules**: From C Anatomy and Memory Layout to Pointer Arithmetic, `malloc`/`free`, Custom Structs, and Singly Linked Lists.
- **One-Click Code Loaders**: Load lesson snippets directly into the editor for instant hands-on experimentation.

### Phase 8: Challenges & Automated Judge
- **Automated Test Runner**: Executes student C code against test suites with standard input injection.
- **Precision Diff Validation**: Verifies whitespace-normalized stdout against expected outputs.
- **Test Feedback**: Detailed breakdowns of execution times, exit codes, and passed/failed assertions.

### Phase 9: Profile & Progress Tracking
- **Developer Profiles**: Tracks total compilation runs, solved challenges, and completed lessons.
- **Live Badges & Streaks**: Visual accomplishment badges (C Novice, Memory Master, Bug Hunter, Algorithmist).

### Phase 10: Sharing & Collaboration
- **Quick Project Links**: Encodes project state into base64 URLs for instant sharing with peers.
- **Project Duplication**: Clone existing projects into independent workspaces.

### Phase 11: Security Audit
- No sensitive keys exposed to browser (Gemini key remains strictly server-side).
- Shell execution uses parameterized argument arrays in `spawn()` to prevent shell injection attacks.
- Strict timeout handlers on all subprocesses.

### Phase 12: Production Build & Deployment
- Bundled server entry point via `esbuild` to `dist/server.cjs`.
- Production SPA assets served directly from `dist/` with single-command `npm run build` and `npm start`.

---

## Local Setup Prerequisites

If running CodeForge C outside the cloud sandbox or on your local machine:

### Linux (Ubuntu / Debian)
```bash
sudo apt update
sudo apt install -y build-essential gcc
```

### macOS
```bash
xcode-select --install
# or via Homebrew:
brew install gcc
```

### Windows
1. Install [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) with Ubuntu and run `sudo apt install build-essential gcc`.
2. Alternatively, install [MinGW-w64](https://www.mingw-w64.org/) and add `gcc` to your system `PATH`.

### Node.js Requirements
- Node.js 18+ or 20+
- Run `npm install` followed by `npm run dev`
