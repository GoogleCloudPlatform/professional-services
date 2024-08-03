FROM alpine:3.8
RUN apk add --no-cache bash gettext
COPY entrypoint.bash /builder/entrypoint.bash
ENTRYPOINT ["/builder/entrypoint.bash"]
