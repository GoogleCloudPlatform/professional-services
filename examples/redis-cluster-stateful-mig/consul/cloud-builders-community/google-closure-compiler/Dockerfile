FROM openjdk:8

WORKDIR closure-compiler
RUN \
  wget \
    --quiet \
    --output-document compiler-latest.zip \
    https://dl.google.com/closure-compiler/compiler-latest.zip && \
    unzip compiler-latest.zip -d .

RUN rm compiler-latest.zip COPYING README.md
RUN mv closure-compiler-v201[0-9]*.jar closure-compiler.jar
RUN ls

ENTRYPOINT ["java","-jar","/closure-compiler/closure-compiler.jar"]
