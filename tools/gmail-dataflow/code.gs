var SHEET_ID     = "YOUR_SHEET_ID";
var PRIVATE_KEY  = "-----YOUR_PRIVATE_KEY";
var CLIENT_EMAIL = "EMAIL_OF_SERVICE_ACCOUNT";
var TOPIC_NAME   = "projects/YOUR_PROJECT_ID/topics/TOPIC_NAME";

function myFunction() {
  var sheetid = SHEET_ID;
  var ss = SpreadsheetApp.openById(sheetid);
  
  // Sheet name from which it will read the domains
  var sheet = ss.getSheetByName('domains'); 
  
  for(var i=2;i<10;i++){
    var range = sheet.getRange(i,1); 
    var data = range.getValue();
    if (data !=""){
      getUsers(data,ss);
    }
  }
}

function getUsers(domain, ss){
  Logger.log("\nRegistering users for domain: (%s) \nTime:(%s)", domain,(new Date()) );
  var pageToken;
  var page;
  var rowNum = 2;
  do {
    page = AdminDirectory.Users.list({
      domain: domain,
      orderBy: 'givenName',
      maxResults: 100,
      pageToken: pageToken
    });
    var users = page.users;
    if (users) {
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        Logger.log('User Name: (%s) User email: (%s)', user.name.fullName, user.primaryEmail);
        
        // Name of the user sheet where the results are stored
        var sheet = ss.getSheetByName('users'); 
        
        //Logger.log("Calling watch service");
        var results = enrollEmail(user.primaryEmail);
        
        var epoch =  JSON.parse(results).expiration * 1;
        var expdate = new Date(epoch);
        //Logger.log("Expiration date and time 2: " + epoch + " date : " + expdate);
        
        sheet.getRange(rowNum,1).setValue(user.name.fullName);
        sheet.getRange(rowNum,2).setValue(user.primaryEmail);
        sheet.getRange(rowNum,3).setValue(new Date());
        sheet.getRange(rowNum,4).setValue(results);
        sheet.getRange(rowNum,5).setValue(expdate);
        
        rowNum ++;
      }
    } else {
      Logger.log('No users found.');
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  
}

function enrollEmail(email){
  var service = getService(email);
  service.reset(); 
  var token = service.getAccessToken(); 
  
  var url = "https://www.googleapis.com/gmail/v1/users/" + email +"/watch"
  var payload = {
    topicName: TOPIC_NAME  
  }
  var options = {method:"POST",
                 headers:{"Authorization": "Bearer "+token},
                 muteHttpExceptions:true,
                 contentType:"application/json",
                 payload:JSON.stringify(payload)               
                }
  var results = UrlFetchApp.fetch(url, options);  
  //Logger.log(results);
  return results;
}

function getService(email) {
  return OAuth2.createService('Gmail Service:' + email)
      // Set the endpoint URL.
      .setTokenUrl('https://oauth2.googleapis.com/token')
      // Set the private key and issuer.
      .setPrivateKey(PRIVATE_KEY)
      .setIssuer(CLIENT_EMAIL)
      // Set the name of the user to impersonate. This will only work for
      // Google Apps for Work/EDU accounts whose admin has setup domain-wide
      // delegation:
      // https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority
      .setSubject(email)
      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getScriptProperties())
      // Set the scope. This must match one of the scopes configured during the
      // setup of domain-wide delegation.
      .setScope('https://www.googleapis.com/auth/gmail.readonly')
}

