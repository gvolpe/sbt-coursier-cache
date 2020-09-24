sbt-coursier-cache
==================

#### one-liner sbt and coursier cache for GitHub Actions

Add this step before running any `sbt` command:

```yml
- uses: gvolpe/sbt-coursier-cache@v1.0
```

For example:

```yml
name: CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-18.04
    steps:
    - uses: actions/checkout@v1

    - uses: gvolpe/sbt-coursier-cache@v1.0

    - name: Build Scala project
      run: nix-shell --run "sbt compile"
```

### Native solution

This one-liner action is the equivalent to doing the following:

```yml
- run: |
    shasum build.sbt \
      project/plugins.sbt \
      project/build.properties \
      project/Dependencies.scala > gha.cache.tmp

- name: "~/.sbt cache"
  uses: "actions/cache@v1"
  with:
    key: "${{ runner.os }}-sbt-${{ hashFiles('gha.cache.tmp') }}"
    path: "~/.sbt"
    restore-keys: sbt

- name: "~/.cache/coursier cache"
  uses: "actions/cache@v1"
  with:
    key: "${{ runner.os }}-coursier-${{ hashFiles('gha.cache.tmp') }}"
    path: "~/.cache/coursier"
    restore-keys: coursier
```

## Credits

This action has been inspired by [gha-yarn-cache](https://github.com/c-hive/gha-yarn-cache).

## License

The project is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
