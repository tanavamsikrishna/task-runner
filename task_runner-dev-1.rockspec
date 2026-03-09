package = 'task_runner'
version = 'dev-1'
source = {
  url = 'git+https://github.com/tanavamsikrishna/task-runner.git',
}
description = {
  homepage = 'https://github.com/tanavamsikrishna/task-runner',
  license = 'MIT',
}
build = {
  type = 'builtin',
  modules = {
    ['task_runner.helpers'] = 'task_runner/helpers.lua',
    ['task_runner._set_paths'] = 'task_runner/_set_paths.lua',
  },
  install = {
    bin = {
      'trn',
    },
  },
}
dependencies = {
  'luaposix',
  'lua-term',
}
