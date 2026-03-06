# Code Style and Conventions

## Lua Style

**Formatting (from .stylua.toml):**
- Column width: 120 characters
- Line endings: Unix
- Indent type: Spaces
- Indent width: 2 spaces
- Quote style: Auto prefer single quotes

**Naming Conventions:**
- snake_case for variables and functions
- UPPER_CASE for module-level constants
- Module tables use `M` as the standard name
- Functions use `function M.name()` pattern for module exports

**Module Pattern:**
```lua
local M = {}
M._index = M
setmetatable(M, M)
-- define functions as M.function_name
return M
```

**Type Hints:**
- LuaDoc/LDoc style comments are used for type hints
- Example: `---@param task_seq string[]`

**Code Organization:**
- One module per file
- Files in `task_runner/` directory
- Use `require('task_runner.module_name')` pattern
- Private functions don't use `M.` prefix

**Error Handling:**
- Use `assert()` for programming errors
- Use `io.stderr:write()` + `os.exit()` for user-facing errors
- Use `pcall()` for catching errors from external code

**Strings:**
- Prefer single quotes for simple strings
- Use double quotes when interpolation or escape sequences needed