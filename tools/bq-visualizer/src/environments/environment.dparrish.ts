// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  name: 'dev',
  bqUrl: 'https://www.googleapis.com/bigquery/v2/projects',

  authConfig: {
    // Url of the Identity Provider
    issuer: 'https://accounts.google.com',

    // URL of the SPA to redirect the user to after login
    redirectUri: window.location.origin + '/jobs',

    // The SPA's id. The SPA is registerd with this id at the auth-server
    clientId:
        '699963415840-s7ns6ehdtg8grqsrf6b9aes9vp2h8gm3.apps.googleusercontent.com',

    // Set the scope for the permissions the client should request
    scope: 'profile email https://www.googleapis.com/auth/bigquery ',
    strictDiscoveryDocumentValidation: false,
    showDebugInformation: true
  },
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
