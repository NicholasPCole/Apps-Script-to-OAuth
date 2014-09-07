/**
 * Handles requests to the web app, including the OAuth 2.0 authorization workflow.
 *
 * @param {Object} An optional HTTP GET request sent to the web app.
 */
function doGet(request) {
  var scriptProperties = PropertiesService.getScriptProperties();
  
  if (request.parameters.code) {
    /* An Authorization Grant (code) was received. Let's exchange it for an Access Token. */
    
    var accessTokenRequest = JSON.parse(UrlFetchApp.fetch(scriptProperties.getProperty('tokenUrl'), {
      'method': 'post',
      'payload': {
        'code': request.parameters.code[0],
        'client_id': scriptProperties.getProperty('clientId'),
        'client_secret': scriptProperties.getProperty('clientSecret'),
        'grant_type': 'authorization_code',
        'redirect_uri': scriptProperties.getProperty('redirectUrl')
      }
    }));
    
    if (accessTokenRequest.access_token) {
      scriptProperties.setProperties({
        'accessToken': accessTokenRequest.access_token,
        'accessTokenExpiry': (now_() + accessTokenRequest.expires_in).toString()
      });
      
      if (accessTokenRequest.refresh_token) {
        scriptProperties.setProperty('refreshToken', accessTokenRequest.refresh_token);
      }
    }
  }
  
  if (!scriptProperties.getProperty('accessToken')) {
    return HtmlService.createHtmlOutput('Please <a href="' + getAuthorizeUrlFull_() + '">authorize</a> to obtain a token.')
  } else if (now_() > scriptProperties.getProperty('accessTokenExpiry')) {
    return HtmlService.createHtmlOutput('The token is expired. Please <a href="' + getAuthorizeUrlFull_() + '">authorize</a>.');
  } else {
    return HtmlService.createHtmlOutput('You are authorized.');
  }
}

/**
 * Gets the OAuth 2.0 access token.
 *
 * @return {string} The OAuth 2.0 access token.
 */
function getAccessToken() {
  var scriptProperties = PropertiesService.getScriptProperties();
  
  if (!scriptProperties.getProperty('accessToken')) {
    Logger.log('There is no access token saved. Please authenticate.');
    return null;
  } else if (now_() < scriptProperties.getProperty('accessTokenExpiry')) {
    return scriptProperties.getProperty('accessToken');
  } else if (now_() > scriptProperties.getProperty('accessTokenExpiry')) {
    var refreshTokenRequest = UrlFetchApp.fetch(scriptProperties.getProperty('tokenUrl'), {
      'method': 'post',
      'payload': {
        'client_id': scriptProperties.getProperty('clientId'),
        'client_secret': scriptProperties.getProperty('clientSecret'),
        'grant_type': 'refresh_token',
        'refresh_token': scriptProperties.getProperty('refreshToken')
      }
    });
    var refreshToken = JSON.parse(refreshTokenRequest);
    
    if (refreshToken.access_token) {
      scriptProperties.setProperties({
        'accessToken': refreshToken.access_token,
        'accessTokenExpiry': (now_() + refreshToken.expires_in).toString()
      });
      
      return refreshToken.access_token;
    }
  } else {
    Logger.log('Some unexpected condition occurred.');
    return null;
  }
}

function getAuthorizeUrlFull_() {
  var scriptProperties = PropertiesService.getScriptProperties();
  
  var parameters = {
    'access_type': 'offline',
    'approval_type': 'auto',
    'client_id': scriptProperties.getProperty('clientId'),
    'include_granted_scopes': 'false',
    'redirect_uri': scriptProperties.getProperty('redirectUrl'),
    'response_type': 'code',
    'scope': 'https://www.googleapis.com/auth/fusiontables'
  };
  
  var urlSuffix = [];
  
  for (key in parameters) {
    urlSuffix.push(key + '=' + parameters[key]);
  }
    
  return scriptProperties.getProperty('authorizeUrlBase') + '?' + urlSuffix.join('&');
}

function now_() {
  return Math.round(Date.now() / 1000);
}

/**
 * Sends an SQL query to a Fusion Table.
 *
 * @param {string} table The name of the Fusion Table to query. Not used; retained only to explain the operation of other query functions.
 * @param {string} tid The ID of the Fusion Table to query.
 * @param {string} sql The SQL query, where TABLEID is replaced with tid.
 * @returns {HTTPResponse} The response from the Fusion Tables API.
 */
function query_(table, tid, sql) {
  var query = '';
  
  // This point in the code originally contained an if-else block replacing
  // table (a string representing the table name) with the corresponding
  // table ID. Since the tables used in development of this script are private,
  // there is no use in including those table IDs in this script's publication.
  query = sql.replace('TABLEID', tid);
  
  return UrlFetchApp.fetch('https://www.googleapis.com/fusiontables/v1/query', {
    'headers': {
      'Authorization': 'Bearer ' + getAccessToken(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    'method': 'post',
    'muteHttpExceptions': true,
    'payload': {
      'sql': query
    }
  });
}

/**
 * Sends an SQL query to the Voicemails Fusion Table.
 *
 * @param {string} sql The SQL query, where TABLEID is replaced with the ID of the Voicemails table by the function.
 * @returns {HTTPResponse} The response from the Fusion Tables API.
 */
function queryVoicemails(sql) {
  return query_('Voicemails', sql);
}

/**
 * Sends an SQL query to the Shifts Fusion Table.
 *
 * @param {string} sql The SQL query, where TABLEID is replaced with the table ID by the function.
 * @returns {HTTPResponse} The response from the Fusion Tables API.
 */
function queryShifts(sql) {
  return query_('Shifts', sql);
}

function removeAccessToken() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('accessToken');
  scriptProperties.deleteProperty('accessTokenExpiry');
}

function removeRefreshToken_() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('refreshToken');
}

function setupScriptProperties_() {
  // Be sure to manually save the client ID and client secret by going to File > Project properties > Project properties!
  
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'authorizeUrlBase': 'https://accounts.google.com/o/oauth2/auth',
    'redirectUrl': ScriptApp.getService().getUrl(),
    'tokenUrl': 'https://accounts.google.com/o/oauth2/token'
  });
}
