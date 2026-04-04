local M = {}

M._index = M
setmetatable(M, M)

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
