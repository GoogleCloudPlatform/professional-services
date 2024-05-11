# Flutter (https://flutter.io) Developement Environment for Linux
# ===============================================================
#
# This environment passes all Linux Flutter Doctor checks and is sufficient
# for building Android applications and running Flutter tests.
#
# To build iOS applications, a Mac development environment is necessary.
#

FROM debian:bookworm
MAINTAINER Chinmay Garde <chinmaygarde@google.com>

# Install Dependencies.
RUN apt update -y
RUN apt install -y \
  git \
  wget \
  curl \
  unzip \
  lib32stdc++6 \
  libglu1-mesa \
  default-jdk-headless

# Install the Android SDK Dependency.
ENV ANDROID_SDK_URL="https://dl.google.com/android/repository/commandlinetools-linux-7302050_latest.zip"
ENV ANDROID_TOOLS_ROOT="/opt/android_sdk"
RUN mkdir -p "${ANDROID_TOOLS_ROOT}/cmdline-tools"
ENV ANDROID_SDK_ARCHIVE="${ANDROID_TOOLS_ROOT}/archive"
RUN wget -q "${ANDROID_SDK_URL}" -O "${ANDROID_SDK_ARCHIVE}"
RUN unzip -q -d "${ANDROID_TOOLS_ROOT}/cmdline-tools" "${ANDROID_SDK_ARCHIVE}"
RUN mv "${ANDROID_TOOLS_ROOT}/cmdline-tools/cmdline-tools" "${ANDROID_TOOLS_ROOT}/cmdline-tools/latest"
RUN yes "y" | "${ANDROID_TOOLS_ROOT}/cmdline-tools/latest/bin/sdkmanager" "build-tools;28.0.0"
RUN yes "y" | "${ANDROID_TOOLS_ROOT}/cmdline-tools/latest/bin/sdkmanager" "platforms;android-28"
RUN yes "y" | "${ANDROID_TOOLS_ROOT}/cmdline-tools/latest/bin/sdkmanager" "platform-tools"
RUN rm "${ANDROID_SDK_ARCHIVE}"
ENV PATH="${ANDROID_TOOLS_ROOT}/cmdline-tools/latest:${PATH}"
ENV PATH="${ANDROID_TOOLS_ROOT}/cmdline-tools/latest/bin:${PATH}"

# Install Flutter.
ENV FLUTTER_ROOT="/opt/flutter"
RUN git clone https://github.com/flutter/flutter "${FLUTTER_ROOT}"
ENV PATH="${FLUTTER_ROOT}/bin:${PATH}"
ENV ANDROID_HOME="${ANDROID_TOOLS_ROOT}"

# Disable analytics and crash reporting on the builder.
RUN flutter config  --no-analytics

# Perform an artifact precache so that no extra assets need to be downloaded on demand.
RUN flutter precache

# Accept licenses.
RUN yes "y" | flutter doctor --android-licenses

# Perform a doctor run.
RUN flutter doctor -v

# Switch to the correct channel
ARG channel=stable
RUN flutter channel $channel

# Perform a flutter upgrade
RUN flutter upgrade

ENTRYPOINT [ "flutter" ]
