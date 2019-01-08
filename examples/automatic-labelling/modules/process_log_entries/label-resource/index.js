const { google } = require("googleapis");
const { auth } = google;
const compute = google.compute("v1");

authenticate = (successCallback, failureCallback) => {
  console.log("Authenticating");
  auth.getApplicationDefault((error, authClient) => {
    if (error) {
      console.error("Error while authenticating");

      return failureCallback(error);
    }
    console.log("Authenticated");

    return successCallback(authClient);
  });
};

fetchLabels = (
  { auth, instance, project, zone },
  successCallback,
  failureCallback
) => {
  console.log("Fetching labels");
  compute.instances.get(
    {
      auth,
      instance,
      project,
      zone
    },
    (error, response) => {
      if (error) {
        console.error("Error while fetching labels");

        return failureCallback(error);
      }

      const labels = response.data.labels || {};
      const labelFingerprint = response.data.labelFingerprint;

      console.log("Fetched labels:", labels, labelFingerprint);

      return successCallback(labels, labelFingerprint);
    }
  );
};

storeLabels = (
  { auth, instance, labelFingerprint, labels, project, zone },
  successCallback,
  failureCallback
) => {
  console.log("Storing labels");
  compute.instances.setLabels(
    {
      auth,
      instance,
      project,
      resource: {
        labels: labels,
        labelFingerprint: labelFingerprint
      },
      zone
    },
    (error, response) => {
      if (error) {
        console.error("Error while storing labels");

        return failureCallback(error);
      }
      console.log("Stored labels");

      return successCallback();
    }
  );
};

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload and metadata.
 * @param {!Function} callback Callback function to signal completion.
 */
exports.labelResource = (event, callback) => {
  const eventData = JSON.parse(
    Buffer.from(event.data.data, "base64").toString()
  );

  console.log("Received event");
  console.log(eventData);
  authenticate(auth => {
    const instance = eventData.resource.labels.instance_id;
    const project = eventData.resource.labels.project_id;
    const zone = eventData.resource.labels.zone;

    fetchLabels(
      { auth, instance, project, zone },
      (labels, labelFingerprint) => {
        const serviceAccounts = eventData.protoPayload.request
          .serviceAccounts || [{ email: "undefined" }];
        const serviceAccount = serviceAccounts[0].email.split("@")[0];

        storeLabels(
          {
            auth,
            instance,
            labelFingerprint,
            labels: Object.assign(labels, {
              "service-account": serviceAccount
            }),
            project,
            serviceAccount,
            zone
          },
          callback,
          callback
        );
      },
      callback
    );
  }, callback);
};
