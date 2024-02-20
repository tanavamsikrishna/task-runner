package = "task-runner"
version = "dev-1"
source = {
   url = "*** please add URL for source tarball, zip or repository here ***"
}
description = {
   homepage = "*** please enter a project homepage ***",
   license = "*** please specify a license ***"
}
build = {
   type = "builtin",
   modules = {},
   install = {
        bin = {
            "task-runner"
        }
    }
}
dependencies = {
   "lua >= 5.1",
   "argparse"
}
