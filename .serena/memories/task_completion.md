# Task Completion Checklist

When completing a coding task in this project, ensure:

## Code Quality Checks
1. **Format code** - Run `stylua .` or `./trn format` to format all modified files
2. **Lint code** - Run `luacheck .` to check for syntax and style issues

## Testing
- Currently no automated tests are configured
- For functionality changes, manually test by running relevant tasks
- Test with `./trn` command to ensure the application still works

## Git Workflow
- Check `git status` and `git diff` before committing
- Create meaningful commit messages
- Do NOT commit unless explicitly asked by user

## Code Style
- Follow naming conventions (snake_case for functions/variables)
- Use 2-space indentation
- Keep lines under 120 characters
- Prefer single quotes for strings
- Add LuaDoc comments for function parameters when appropriate

## Common Patterns
- Use `require('task_runner.helpers')` for helper utilities
- Use `M.` prefix for exported module functions
- Handle errors with `io.stderr:write()` and `os.exit()` for user-facing errors
- Use `pcall()` when calling external functions that might fail