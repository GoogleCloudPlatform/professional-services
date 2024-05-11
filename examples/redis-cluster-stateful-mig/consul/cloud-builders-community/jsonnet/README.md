# Jsonnet

This is a tool builder to invoke [`jsonnet`](http://jsonnet.org/) commands.

Arguments passed to this builder will be passed to `jsonnet` directly.

The latest available version of `jsonnet` is used.

## Examples

The following example demonstrates using this builder:

### Generate JSON

This `cloudbuild.yaml` uses the `wget` builder to download a copy of `example.jsonnet` taken from the `jsonnet.org` website. It uses this Jsonnet builder to conver it to `example.json`. For convenience, the resulting `example.json` file is output to the Cloud Builder logs using `busybox more` and not persisted outside of the build.

```
// Jsonnet Example
{
    person1: {
        name: "Alice",
        welcome: "Hello " + self.name + "!",
    },
    person2: self.person1 { name: "Bob" },
}
```

`cloudbuild.yaml`:
```
steps:
- name: gcr.io/cloud-builders/wget
  args: [
    '-O',
    'example.jsonnet',
    'https://raw.githubusercontent.com/DazWilkin/cloud-builders-community/master/jsonnet/examples/example.jsonnet'
  ]
- name: gcr.io/${PROJECT_ID}/jsonnet
  args: [
    "eval",
    "--output-file","./example.yaml",
    "./example.jsonnet"
  ]
- name: busybox
  args: ["more","./example.yaml"]
```

# Using the Jsonnet builder

This Jsonnet builder takes a single input file and, if the input is correct, will generate a JSON output. Your `cloudbuild.yaml' needs to provide access to the input files and preserve generated JSON files. Typically, you may do use by trigger the Jsonnet builder from a repository change. Triggers copy the repository contents to Cloud Builders "/workspace" directory from where you may reference them. You may wish to commit generated JSON files back to the repository or elsewhere.
