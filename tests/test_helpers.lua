require('task_runner/_set_paths')

local helpers = require('task_runner.helpers')

local function assert_eq(actual, expected, msg)
  if actual ~= expected then
    error(string.format('%s: expected %s, got %s', msg or 'assertion failed', tostring(expected), tostring(actual)))
  end
end

local function assert_match(str, pattern, msg)
  if not string.find(str, pattern) then
    error(string.format('%s: string "%s" does not match pattern "%s"', msg or 'assertion failed', str, pattern))
  end
end

local function test_proc_success()
  print('Running test_proc_success...')
  local stdout, stderr, status = helpers.proc('echo "hello world"')
  assert_eq(stdout, 'hello world\n', 'stdout should match')
  assert_eq(stderr, '', 'stderr should be empty')
  assert_eq(status, 0, 'status should be 0')
end

local function test_proc_failure()
  print('Running test_proc_failure...')
  local stdout, stderr, status = helpers.proc('ls non_existent_file_123456')
  assert_eq(stdout, '', 'stdout should be empty')
  local is_error = string.find(stderr, 'non_existent_file_123456') or string.find(stderr, '[Nn]o such file')
  assert_eq(is_error ~= nil, true, 'stderr should contain error indicator')
  assert_eq(status ~= 0, true, 'status should not be 0')
end

local function test_shell_success()
  print('Running test_shell_success...')
  local original_os_execute = os.execute
  local original_os_exit = os.exit

  local ok, err = pcall(function()
    local execute_called = false
    os.execute = function(cmd)
      execute_called = true
      assert_eq(cmd, 'true', 'should execute "true"')
      return true, 'exit', 0
    end

    os.exit = function()
      error('os.exit should not be called on success')
    end

    helpers.shell('true')
    assert_eq(execute_called, true, 'os.execute should have been called')
  end)

  -- Restore
  os.execute = original_os_execute
  os.exit = original_os_exit

  if not ok then
    error(err)
  end
end

local function test_shell_failure()
  print('Running test_shell_failure...')
  local original_os_execute = os.execute
  local original_os_exit = os.exit

  local ok, err = pcall(function()
    local exit_code = nil

    os.execute = function(cmd)
      return nil, 'exit', 1
    end

    os.exit = function(code)
      exit_code = code
      error('MOCK_EXIT')
    end

    local ok_shell, err_shell = pcall(function()
      helpers.shell('false')
    end)

    assert_eq(ok_shell, false, 'should have errored out of shell due to mock exit')
    assert_match(err_shell, 'MOCK_EXIT', 'should have been caught by mock exit')
    assert_eq(exit_code, 1, 'os.exit should be called with code 1')
  end)

  -- Restore
  os.execute = original_os_execute
  os.exit = original_os_exit

  if not ok then
    error(err)
  end
end

local function test_shell_interrupted()
  print('Running test_shell_interrupted...')
  local original_os_execute = os.execute
  local original_os_exit = os.exit

  local ok, err = pcall(function()
    local exit_code = nil

    os.execute = function(cmd)
      return nil, 'signal', 2
    end

    os.exit = function(code)
      exit_code = code
      error('MOCK_EXIT')
    end

    local ok_shell, err_shell = pcall(function()
      helpers.shell('sleep 10')
    end)

    assert_eq(ok_shell, false, 'should have errored out of shell due to mock exit')
    assert_match(err_shell, 'MOCK_EXIT', 'should have been caught by mock exit')
    assert_eq(exit_code, 2, 'os.exit should be called with signal code 2')
  end)

  -- Restore
  os.execute = original_os_execute
  os.exit = original_os_exit

  if not ok then
    error(err)
  end
end

local function run_all_tests()
  local tests = {
    test_proc_success,
    test_proc_failure,
    test_shell_success,
    test_shell_failure,
    test_shell_interrupted,
  }

  local failed = false
  for _, test in ipairs(tests) do
    local ok, err = pcall(test)
    if not ok then
      print('Test failed: ' .. tostring(err))
      failed = true
    end
  end

  if failed then
    os.exit(1)
  else
    print('\nAll tests passed!')
  end
end

run_all_tests()
