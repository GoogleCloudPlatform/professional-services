export const environment = {
  production: true,
  name: 'prod',
  bqUrl: 'https://www.googleapis.com/bigquery/v2/projects',

  authConfig: {
    // Url of the Identity Provider
    issuer: 'https://accounts.google.com',

    // URL of the SPA to redirect the user to after login
    redirectUri: window.location.origin + '/jobs',

    // The SPA's id. The SPA is registerd with this id at the auth-server
    clientId:
        '699963415840-s7ns6ehdtg8grqsrf6b9aes9vp2h8gm3.apps.googleusercontent.com',
    clientSecret: '-bSKcuv2mYDgpLFgvdIiaF2R',

    // Set the scope for the permissions the client should request
    scope: 'profile email https://www.googleapis.com/auth/bigquery',
    strictDiscoveryDocumentValidation: false,
    showDebugInformation: true,
  },
};
