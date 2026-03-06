#!/usr/bin/env nu
# Test script for trn completions
# Run with: nu test-completions.nu
#
# Note: This tests the LOCAL ./trn script.
# For testing the installed version, remove the TRN_PATH line.

$env.TRN_PATH = "./trn"  # Use local trn for testing

def test-completions [] {
    let tests = [
        {name: "Root tasks", args: [], expected_count: 8}
        {name: "Subtask (task2)", args: ["task2"], expected_count: 4}
        {name: "Partial match (ta)", args: ["task2", "ta"], expected_count: 2}
        {name: "Trailing space (task2 )", args: ["task2", ""], expected_count: 4}
        {name: "Empty partial", args: ["task2", "task1", ""], expected_count: 0}
    ]

    print "Running completion tests..."
    print ""

    let trn_path = ($env.TRN_PATH? | default "trn")

    let results = $tests | each {|test|
        let result = (^$trn_path --completions ...$test.args | lines)
        let count = ($result | length)
        let passed = $count == $test.expected_count

        print $"($test.name): ($count)/($test.expected_count) lines - (if $passed {'✓ PASS'} else {'✗ FAIL'})"

        {name: $test.name, passed: $passed, expected: $test.expected_count, actual: $count}
    }

    print ""
    let passed = ($results | where {|r| $r.passed} | length)
    let total = ($results | length)
    print $"Summary: ($passed)/($total) tests passed"

    if $passed != $total {
        exit 1
    }
}

test-completions