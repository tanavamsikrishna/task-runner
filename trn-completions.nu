# Configuration: set to path of trn if not in PATH
# For development/testing, you can set: let-env TRN_PATH = "./trn"
def "trn-complete" [context: string, position: int] {
    let cmd_line = ($context | split row -r '\s+')
    let task_args = ($cmd_line | skip 1 | where {|x| $x != ''})

    let trn_cmd = ($env.TRN_PATH? | default "trn")

    let completions = (do {
        ^$trn_cmd --completions ...$task_args
    } | lines | split column -r '\t' n d | default '' d)

    $completions | each {|row|
        {value: $row.n, description: $row.d}
    }
}

export extern "trn" [
    ...tasks: string@"trn-complete"  # task names (supports nested tasks)
]