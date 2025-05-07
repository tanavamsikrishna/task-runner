-- set_paths.lua
local version = _VERSION:match('%d+%.%d+')
package.path = 'task_runner/?.lua;'
  .. ('lua_modules/rocks-' .. version .. '/?.lua;')
  .. ('lua_modules/rocks-' .. version .. '/?/init.lua;')
  .. package.path
package.cpath = ('lua_modules/rocks-' .. version .. '/?.so;') .. package.cpath
