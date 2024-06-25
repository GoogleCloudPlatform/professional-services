FROM alpine:3.10 AS build
RUN  apk --no-cache add wget

RUN wget -O /kube-advisor https://alcide.blob.core.windows.net/generic/stable/linux/advisor &&\
  chmod +x /kube-advisor


FROM scratch

WORKDIR /
COPY --from=build /kube-advisor /kube-advisor


ENTRYPOINT  ["/kube-advisor"]