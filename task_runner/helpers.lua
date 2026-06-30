local pl_utils = require('pl.utils')

local M = {}

M._index = M
setmetatable(M, M)

---@param cmd string
---@param args? string|table<string>
local function _build_cmd(cmd, args)
  if args == nil or (type(args) == 'table' and #args == 0) then
    return cmd
  end
  return cmd .. ' ' .. pl_utils.quote_arg(args)
end

-- Runs a command and returns stdout, stderr, and exit_code
---@param cmd string
---@param args? string|table<string>
---@return string stdout
---@return string stderr
---@return integer exit_code
function M.proc(cmd, args)
  local full_cmd = _build_cmd(cmd, args)
  local _, exit_code, stdout, stderr = pl_utils.executeex(full_cmd)
  return stdout, stderr, exit_code
end

-- Runs a command and redirects output to console and kills the program if cmd fails
---@param cmd string
---@param args? string|table<string>
function M.shell(cmd, args)
  local full_cmd = _build_cmd(cmd, args)
  local compat = require('pl.compat')
  local success, exit_code = compat.execute(full_cmd)
  if not success then
    pl_utils.quit(exit_code)
  end
end

return M
