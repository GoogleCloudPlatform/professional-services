/**
 * Background Cloud Function to be triggered by Cloud Storage.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} callback The callback function.
 */

const gcs = require('@google-cloud/storage')();

exports.removePublicAccess = function (event, callback) {
  const object = event.data;
  const file = gcs.bucket(object.bucket).file(object.name);
  console.log(`Ensuring no public ACLs on ${file.name}`);
  file.acl.owners.deleteAllAuthenticatedUsers();
  file.acl.owners.deleteAllUsers();
  file.acl.readers.deleteAllAuthenticatedUsers();
  file.acl.readers.deleteAllUsers();
  file.acl.writers.deleteAllAuthenticatedUsers();
  file.acl.writers.deleteAllUsers();

  callback();
};

