# Task Runner Project Overview

**Project Name:** task-runner

**Purpose:** A Lua-based task runner that allows users to define and execute tasks from a `tasks.lua` file. Similar to tools like `just` or `make`, it provides a way to organize and run development tasks with support for nested tasks, setup functions, and shell command execution.

**Main Entry Point:** `trn` executable script

**Key Features:**
- Define tasks in `tasks.lua` file
- Support for nested tasks (namespaced with spaces)
- Tasks can be strings (shell commands), functions, or tables with metadata
- Support for `_setup` functions that run before task execution
- Support for `_action` to define the runnable part of a task
- Support for `_desc` to add descriptions to tasks
- Shell completion support (currently fish shell)

**Tech Stack:**
- Language: Lua 5.4
- Package Manager: LuaRocks
- Key Dependencies:
  - luaposix (for process execution)
  - lua-term (for terminal colors)
  - inspect (for debugging)
  - lunajson (for JSON parsing)

**Project Structure:**
- `trn` - Main executable entry point
- `tasks.lua` - Example task definition file
- `task_runner/` - Source code directory
  - `_set_paths.lua` - Sets up package paths
  - `helpers.lua` - Helper functions for process execution
- `.luacheckrc` - Lua check configuration
- `.stylua.toml` - StyLua formatter configuration