# Suggested Commands

## Development Commands

### Running the Project
```bash
./trn [task_name]
```
Run a specific task defined in tasks.lua

### Running Without Installation
```bash
lua-5.4 trn [task_name]
```

### Installation
```bash
luarocks --lua-version=5.4 make --local
```
Install the package locally

### Global Installation
```bash
./trn deploy
```
Or manually:
```bash
luarocks --lua-version=5.4 make --global
```

## Code Quality

### Formatting
```bash
./trn format
```
Or directly:
```bash
stylua .
```
Format all Lua files according to .stylua.toml

### Linting
```bash
luacheck .
```
Run LuaCheck on all files (respects .luacheckrc)

## Testing
No test framework is currently configured in the project. Manual testing can be done by running tasks defined in tasks.lua.

## Git Commands
Standard git commands work as expected:
```bash
git status
git add .
git commit -m "message"
git push
```

## File System Commands (macOS/Darwin)
```bash
ls -la          # List files
find . -name "*.lua"  # Find Lua files
grep -r "pattern" .   # Search in files
```