package = 'task_runner'
version = 'dev-1'
source = {
  url = '*** please add URL for source tarball, zip or repository here ***',
}
description = {
  homepage = '*** please enter a project homepage ***',
  license = '*** please specify a license ***',
}
build = {
  type = 'builtin',
  modules = {
    ['task_runner.helpers'] = 'task_runner/helpers.lua',
    ['task_runner.set_paths'] = 'task_runner/set_paths.lua',
  },
  install = {
    bin = {
      'trn',
    },
  },
}
dependencies = {
  platforms = {
    unix = {
      'lua >= 5.1, < 5.2',
      'luaposix',
      'lua-term',
      'inspect',
      'lunajson',
    },
  },
}
