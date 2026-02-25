-- set_paths.lua
local version = _VERSION:match('%d+%.%d+')
local home = os.getenv('HOME') or os.getenv('USERPROFILE')

local user_path = ''
local user_cpath = ''
if home then
  user_path = (home .. '/.luarocks/share/lua/' .. version .. '/?.lua;')
    .. (home .. '/.luarocks/share/lua/' .. version .. '/?/init.lua;')
  user_cpath = (home .. '/.luarocks/lib/lua/' .. version .. '/?.so;')
end

package.path = 'task_runner/?.lua;'
  .. ('lua_modules/share/lua/' .. version .. '/?.lua;')
  .. ('lua_modules/share/lua/' .. version .. '/?/init.lua;')
  .. user_path
  .. package.path
package.cpath = ('lua_modules/lib/lua/' .. version .. '/?.so;') .. user_cpath .. package.cpath
