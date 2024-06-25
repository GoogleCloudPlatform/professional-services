# Google Closure Compiler builder

This is a tool builder to invoke [`Google Closure Compiler`](https://developers.google.com/closure/compiler/) commands. Google Closure Compiler has Java and JavaScript implementations. This builder uses the [Java](https://github.com/google/closure-compiler).

Arguments passed to this builder will be passed to `google-closure-compiler` directly.

The latest available version of `google-closure-compiler` is used.

## Examples

The following example demonstrates using this builder:

### Generate Closure Compiled code

This `cloudbuild.yaml` uses this builder to convert to convert the "Hello World" function used in the [Google Closure Compiler documentation](https://developers.google.com/closure/compiler/). For convenience, the optimized JavaScript is output to the Cloud Builder logs using `busybox more` and not persisted outside of the build.

```
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name default.js
// ==/ClosureCompiler==

// ADD YOUR CODE HERE
function hello(name) {
  alert('Hello, ' + name);
}
hello('New user');
```

`cloudbuild.yaml`:
```
steps:
# Use the wget builder to retrieve the helloworld.js file from the GitHub repo
- name: gcr.io/cloud-builders/wget
  args: [
    "--output-document", "helloworld.js",
    "https://raw.githubusercontent.com/DazWilkin/cloud-builders-google-closure-compiler/master/google-closure-compiler/examples/helloworld.js"
  ]
# Apply Google Closure Compiler to helloworld.js producing an optimized helloworld.out.js
- name: gcr.io/${PROJECT_ID}/google-closure-compiler
  args: [
    "--js_output_file=helloworld.out.js",
    "helloworld.js"
  ]
# Use busybox to 'more' the helloworld.out.js to the Cloud Builder logs
- name: busybox
  args: [
    "more", "helloworld.out.js"
  ]
```

# Using the Google Closure Compiler builder

This Google Closure Compiler builder takes a single input file runs the file through the Google Closure Compiler and produces optimized JavaScript output. Your `cloudbuild.yaml' needs to provide access to the input file and preserve generated JavaScript output.

Typically, you may do this by triggering the Google Closure Compiler builder from a repository change. Triggers copy the repository contents to Cloud Builders "/workspace" directory from where you may reference them. You may wish to commit optimized JavaScript files back to the repository or elsewhere.

This builder could be used as a way to optimize JavaScript code destined for deployment to [Google Cloud Functions](https://cloud.google.com/functions/)
