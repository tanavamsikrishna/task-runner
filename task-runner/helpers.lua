-- Credits: http://luaposix.github.io/luaposix/examples/dup2.lua.html
local posix = require("posix.unistd")

local M = {}

function M.sh(cmd)
	local stdout_r, stdout_w = posix.pipe()
	local stderr_r, stderr_w = posix.pipe()

	local pid, errmsg = posix.fork()
	assert(pid ~= nil, errmsg)

	if pid == 0 then
		-- Child Process:
		posix.close(stdout_r)
		posix.close(stderr_r)
		posix.dup2(stdout_w, posix.STDOUT_FILENO)
		posix.dup2(stderr_w, posix.STDERR_FILENO)
		local cmd_parts = {}
		for e in string.gmatch(cmd, "[^%s]+") do
			table.insert(cmd_parts, e)
		end
		local executable = table.remove(cmd_parts, 1)
		local _, child_errmsg, child_exit_code = posix.execp(executable, cmd_parts)
		io.stderr:write("Error running cmd `" .. cmd .. "`:\n\t" .. child_errmsg .. "\n")
		os.exit(child_exit_code)
	else
		-- Parent Process:
		posix.close(stdout_w)
		posix.close(stderr_w)

		local function read(fd)
			local msg_parts = {}
			while true do
				local outs, read_errmsg = posix.read(fd, 1024)
				assert(outs ~= nil, read_errmsg)
				if outs == "" then
					break
				end
				table.insert(msg_parts, outs)
			end
			return table.concat(msg_parts)
		end

		local stdout_msg = read(stdout_r)
		local stderr_msg = read(stderr_r)

		local childpid, reason, status = require("posix.sys.wait").wait(pid)
		assert(childpid ~= nil, reason)

		return stdout_msg, stderr_msg, status
	end
end

return M
