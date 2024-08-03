load(
    "@io_bazel_rules_docker//container:container.bzl",
    "container_image",
)

container_image(
    name = "container-diff",
    base = "@base_image//image:image.tar",
    directory = "/bin",
    entrypoint = ["/bin/container-diff-linux-amd64"],
    files = ["@static_binary//file"],
    mode = "0777",
)
