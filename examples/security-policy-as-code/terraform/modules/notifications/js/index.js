/**
 * @fileoverview Description of this file.
 */
const Mailgun = require('mailgun-js');
const humanizeDuration = require('humanize-duration');
const config = require('./config.json');
const {Storage} = require('@google-cloud/storage');

const mailgun = Mailgun({
  apiKey: config.MAILGUN_API_KEY,
  domain: config.MAILGUN_DOMAIN,
});

// subscribeMailgun is the main function called by Cloud Functions.
module.exports.subscribeMailgun = (pubSubEvent, context) => {
  const build = eventToBuild(pubSubEvent.data);

  // If the build.status is not 'FAILURE', we do not send out an email
  if (build.status != 'FAILURE') {
    return;
  }
  // The build is failing, so we download the InSpec output from GCS to attach to the email notification
  const bucketName = config.bucket_name;
  const srcFilename = `reports/${build.id}/security-report.html`; // the source InSpec file is named based on the build.id
  const destFilename = '/tmp/security-report.html'; // local Cloud Function filesystem

  const options = {
      // The path to which the file should be downloaded, e.g. "./file.txt"
      destination: destFilename,
  };

  const storage = new Storage();

  // Downloads the file
  storage.bucket(bucketName)
      .file(srcFilename)
      .download(options, function(err) {
          // We have our attachment and can now create the email
          const message = createEmail(build, destFilename);
          mailgun.messages().send(message, (error, body) => console.log(body.message));
        });
};

// eventToBuild transforms pubsub event message to a build object.
const eventToBuild = (data) => {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}

// createEmail creates an email message from a build object.
const createEmail = (build, attachedFilePath) => {
  const duration = humanizeDuration(new Date(build.finishTime) - new Date(build.startTime));
  const msgText = `Build ${build.id} finished with status ${build.status}, in ${duration}.`;
  let msgHtml = `<p>${msgText}</p><p><a href="https://storage.cloud.google.com/${config.bucket_name}/reports/${build.id}/security-report.html">Link to the Inspec output</a></p>`;
  const message = {
    from: config.MAILGUN_FROM,
    to: config.MAILGUN_TO,
    subject: `Build ${build.id} finished`,
    text: msgText,
    html: msgHtml,
    attachment: attachedFilePath
  };
  return message;
}
