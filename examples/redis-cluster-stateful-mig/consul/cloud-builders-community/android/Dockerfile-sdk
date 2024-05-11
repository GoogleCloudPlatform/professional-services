ARG project_id
FROM gcr.io/$project_id/android:base

ARG android_version

# Update 
RUN sdkmanager "platforms;android-${android_version}"
