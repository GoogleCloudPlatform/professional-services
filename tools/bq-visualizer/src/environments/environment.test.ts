export const environment = {
  production: false,
  name: 'test',
  bqUrl: 'https://www.googleapis.com/bigquery/v2/projects',

  authConfig: {
    // Url of the Identity Provider
    issuer: 'https://accounts.google.com',

    // URL of the SPA to redirect the user to after login
    redirectUri: window.location.origin + '/jobs',

    // The SPA's id. The SPA is registerd with this id at the auth-server
    clientId:
        '697664373295-i3fqtavcagei5qklsighjb8qv2jkm7f3.apps.googleusercontent.com',

    // set the scope for the permissions the client should request
    // The first three are defined by OIDC. The 4th is a usecase-specific one
    scope: 'profile email https://www.googleapis.com/auth/bigquery ',
    strictDiscoveryDocumentValidation: false,
    showDebugInformation: true
  },
};
