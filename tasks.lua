local function task1()
	print("task 1 executed!")
end

local function task2_1()
	print("task2.task1 executed!")
end

local function task2_2()
	print("task2.task2 executed!")
end

return {
	task1 = task1,
	task2 = {
		task1 = {
			_desc = "Run task2.taks1",
			_action = task2_1,
		},
		task2 = task2_2,
		_desc = "Run task2 related tasks",
	},
}
