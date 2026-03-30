# Using `uv`

[uv](https://github.com/astral-sh/uv) is a tool made by [Astral](https://github.com/astral-sh) to replace many Python tools. This document serves to show how `uv` could be used to replace our use of pip, to improve our workflow.

`uv` helpfully includes a [guide for migrating](https://docs.astral.sh/uv/guides/migration/pip-to-project/) from pip to `uv`. This can be used in the event we do move over as a whole team. As of now, migrating can easily be an individual choice for which tool to use.

At any point, if you want to see more information about a command, use `-v` for some verbose output and `-vv` for even more output.

It starts with `uv init`, which makes a `pyproject.toml`. This is done once per project, so that's already complete here. For learning, take a look at `pyproject.toml` and look through the different fields. You'll see the dependencies that Cattlelog uses.

To install the dependencies, run `uv pip install`. This will look into the `pyproject.toml` and will make sure each dependency is properly installed. Read more under [pip interface](https://docs.astral.sh/uv/getting-started/features/#the-pip-interface).

After this is done, you can run `uv pip list` or `uv pip tree` to see all of the packages that are installed.

`uv` uses the term `script` to mean a standalone file that can be run. Normally, you can just run scripts without `uv`, but `uv` gives you the ability to run the script in a specific environment without worrying about managing dependencies for it. This could actually be super helpful for small scripts that use specific large dependencies like `spark` while the rest of our backend does not use `spark`.

If you want to use other technologies with `uv`, check out [integration guides](https://docs.astral.sh/uv/guides/integration/). There is also a specific [FastAPI guide](https://docs.astral.sh/uv/guides/integration/fastapi/) we can use.
