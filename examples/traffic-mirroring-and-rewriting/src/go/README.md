Build
------

If you don't have go installed in your system, you can download it and unpack it in the current directory, then you can run:

```
$ GOCACHE=$PWD/gocache HOME=$PWD GOROOT=./go ./go/bin/go build mirrorplane.go
```

this will build the binary.

Usage
-----

Given a mirror backend running on http://mirrorbackend:8080, you can use mirrorplane by executing


```
  $ MIRROR_BACKEND=http://mirrorbackend:8080 PORT=:8000 ./mirrorbackend
```

