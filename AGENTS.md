# Task Runner

A lightweight, flexible task runner written in Lua. It allows users to define tasks in a `tasks.lua` file using Lua tables, functions, or shell strings.

## Project Overview

- **Core Technology:** Lua >= 5.4
- **Package Manager:** LuaRocks
- **Key Components:**
  - `trn`: The CLI executable script.
  - `tasks.lua`: The configuration file where tasks are defined.
  - `task_runner/`: Source code directory containing helper modules.

## Building and Running

### Installation

The project uses `luarocks` for dependency management and installation.

**Install Dependencies & Build:**
```bash
luarocks make
```

**Install:**
```bash
luarocks --lua-version <lua-version> make --local
```

### Usage

The `trn` tool looks for a `tasks.lua` file in the current working directory.

**List Tasks:**
Running `trn` without arguments will list all available tasks defined in `tasks.lua`.
```bash
trn
```

**Run a Task:**
```bash
trn <task_name>
# Example from local tasks.lua
trn format
```

**Run Nested Tasks:**
Tasks can be organized into namespaces (tables).
```bash
trn <namespace> <task_name>
# Example
trn task2 task1
```

## Configuration (`tasks.lua`)

The `tasks.lua` file must return a Lua table. Keys are task names, and values can be:

1.  **String:** Executes as a shell command.
    ```lua
    list = "ls -la"
    ```
2.  **Function:** Executes as Lua code.
    ```lua
    greet = function() print("Hello World") end
    ```
3.  **Table (Namespace or Detailed Task):**
    - Can contain `_desc` (description), `_setup` (pre-requisite), and `_action` (main logic).
    - Can contain nested keys for sub-tasks.

    ```lua
    deploy = {
      _desc = "Deploy the application",
      _setup = function() print("Checking auth...") end,
      _action = "ansible-playbook deploy.yml"
    }
    ```

## Development Conventions

### Code Style & Linting

- **Formatting:** Uses `stylua`.
  - Configuration: `.stylua.toml`
  - Run: `trn format` (or `stylua .`)
- **Linting:** Uses `luacheck`.
  - Configuration: `.luacheckrc`

### Key Files

- `trn`: Main executable script.
- `task_runner-dev-1.rockspec`: LuaRocks package definition.
- `task_runner/helpers.lua`: Helper functions for tasks (e.g., shell execution).
- `task_runner/_set_paths.lua`: internal module path setup.
