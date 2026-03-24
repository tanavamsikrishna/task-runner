local M = {}

M._index = M
setmetatable(M, M)

-- Runs a command and returns combined stdout/stderr and exit_code
function M.proc(cmd)
  local full_cmd = string.format('(%s) 2>&1', cmd)
  local handle = io.popen(full_cmd, 'r')
  local output = handle:read('*a')
  local success, _, status = handle:close()

  if success then
    status = 0
  elseif type(success) == 'number' then
    -- Fallback for Lua 5.1 / LuaJIT
    status = success / 256
  end

  return output, status
end

function M.shell(cmd)
  local is_success, exitcode, code = os.execute(cmd)
  if is_success then
    return
  end
  if exitcode == 'exit' then
    io.stderr:write('Error running cmd `' .. cmd .. '`\n')
    os.exit(code)
  else
    io.stderr:write('Interrupted with signal `' .. code .. '`\n')
    os.exit(true)
  end
end

return M
