FROM pandoc/core

ARG BOOKDOWN_VERSION=0.21

RUN apk add --update \
    R \
    R-dev \
    make \
    musl-dev \
    g++ && \
    rm -rf /var/chache/apk/*

RUN Rscript -e "install.packages('bookdown', repos = 'https://cloud.r-project.org', clean = TRUE, INSTALL_opts = c('--no-docs', '--no-help', '--no-demo', '--without-keep.source', '--without-keep.parse.data'))"

ENTRYPOINT ["/usr/bin/Rscript"]
CMD ["-e", "bookdown::render_book('index.Rmd', 'all')"]
