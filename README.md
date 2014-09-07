# OAuth 2.0 for Apps Script

Access Google APIs that require OAuth 2.0 authorization.

## Background

I recently worked on a project built on the Google Apps Script platform. One of the features
involved accessing and modifying data in a Fusion Table. Functions are built in to the Apps Script
API for read-only access to the Fusion Tables API and for connecting to other OAauth endpoints;
however, the Fusion Tables API uses OAuth 2.0 and the Apps Script API only supports OAuth 1.0.

I initially wrote this script to work only with the Fusion Tables API and with specific tables.
Since the functionality is not built-in to Apps Script, however, I felt there would be some value
in publishing the code in the hope that others might find it useful.

## Setup

The following properties and values are set in the Script Properties:

* accessToken: Provided by the authorization server after authorizing. 
* accessTokenExpiry: Provided by the authorization server after authorizing.
* authorizeUrlBase: `https://accounts.google.com/o/OAuth2/auth`
* clientId: Found in the Google Developers Console.
* clientSecret: Found in the Google Developers Console.
* redirectUrl: The URL of the script when deployed as a web app.
* refreshToken: Provided by the authorization server after authorizing.
* tokenUrl: `https://accounts.google.com/o/OAuth2/token`

## Project Status

I am working on documentation to more clearly explain how the script works, although I still
recommend glancing through [RFC 6749](http://tools.ietf.org/html/rfc6749) if you are doing any work
with OAuth 2.0.

I will also look into making the script usable with other endpoints, whether Google or not.
