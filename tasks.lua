local utils = require('task_runner.helpers')

local function task1()
  print('task 1 executed!')
end

local function task2_1()
  print('task2.task1 executed!')
end

local function task2_2()
  print('task2.task2 executed!')
end

return {
  deploy = 'luarocks --lua-version=' .. _VERSION:match('%d+%.%d+') .. ' make --global',
  format = 'stylua .',
  ['local'] = task1,
  fn_with_args = function(arg1, arg2)
    print(arg1, arg2)
  end,
  task2 = {
    _setup = function()
      print('Setup for task2')
    end,
    task1 = {
      _desc = 'Run task2.taks1',
      _action = task2_1,
    },
    task2 = task2_2,
    test = function()
      print(require('inspect')(require('lunajson').decode('{"Hello":["lunajson",1.5]}')))
    end,
    _desc = 'Run task2 related tasks',
    test1 = function()
      utils.shell('sleep 2')
    end,
  },
  task3 = {
    _setup = function()
      utils.shell('echo setup run')
    end,
    _action = 'echo Hello',
  },
  task4 = {
    _setup = 'echo setup',
    _action = 'echo Hello',
  },
  task5 = {
    _action = function(prog_args)
      print(table.concat(prog_args, '|'))
    end,
    _desc = 'Just a regular task5',
  },
}
