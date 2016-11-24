# NodeJS Authentication Module for Username-Password or LDAP

Authenticate users either by LDAP and/or username password, according to configuration. So you can have local users and LDAP users at the same time. If a a given user name is not in the list of local users, an LDAP lookup is started.

# Use In Code

The module returns a function that takes a username, a password, a function that is called if username and password matches and a function that is called :

    function(username, password, success, fail);

## Server Side

To create an authenticated websocket connection, write something like:

    var config = require('/path/to/configuration/file/in/json/format');
    var express = require('express');
    var app = express.createServer();
    var io  = require('socket.io').listen(app);
    var authentication = require('authentication.js')(config);

    // New Authenticated Client
    function connection(socket, userdata) {
      console.log("=> new connection from "+userdata.username);
      // here you have an authenticated socket connection
    }
    
    // Handle Connection Authentication
    require('socketio-auth')(io, {
      authenticate: function (socket, data, callback) {
        console.log("=> authenticate: ", data.username);
        authentication(data.username, data.password,
                       function() {
                         console.log("####LOGIN-SUCESS####");
                         callback(null, true)
                       },
                       function() {
                         console.log("####LOGIN-FAILED####");
                         callback(new Error("wrong credentials"))
                       });
      },
      postAuthenticate: connection,
      timeout: "none"
    });

## Client Side

    <!DOCTYPE HTML>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width initial-scale=1" />
        <script type="text/javascript" src="javascripts/jquery.js"></script>
        <script type="text/javascript" src="/socket.io/socket.io.js"></script>
        <script>
          var socket = null;
          function connect() {
            console.log("server connect");
            socket.emit('authentication', {
              username: $("#usernamefield").val(),
              password: $("#passwordfield").val()
            });
          }
          function disconnected() {
            console.log("server disconnected");
          }
          function authenticated() {
            console.log("server authenticated");
          }
          function unauthorized() {
            console.log("authentication failed");
          }
          function init() {
            socket = io.connect();
            docker = new Docker(socket, '#main', error);
            $("#server").html($("#username").value+'@'+window.location.hostname)
            initForms();
            showLogin();
            socket
              .io
              .on("connect", connect)
              .on("reconnect", connect)
              .on("disconnect", disconnected)
              .on("error", disconnected);
            socket
              .on("authenticated", authenticated)
              .on("unauthorized", unauthorized)
          }
          $(init);
        </script>
      </head>
      <body>
        <div id="login">
          <h1>Login</h1>
          <form onsubmit="connect()">
            <label for="usernamefield">User Name</label>
            <input placeholder="User Name" id="usernamefield" type="text" />
            <label for="passwordfield">Password</label>
            <input placeholder="Password" id="passwordfield" type="password" />
            <button type="button" onclick="connect()">Login</button>
          </form>
        </div>
      </body>
    </html>

# Configuration

The sections, `"unrestricted"`, `"passwords"` and `"ldap"` are optional. Without configuration, access is completely blocked. To allow any user without restrictions, use:

    {
      "unrestricted": true
    }

## Username Password

It is possible to define just a list of username an passwords. The passwords are stored in a hashed format. The hash algorithm can be anything that is supported by the [NodeJS Crypto Library](https://nodejs.org/api/crypto.html). The username password configuration is a map with the passwords as key and an array of first the hash type, then the hashed password.

This configuration uses SHA256 hash algorithm and stores the following usernames and password combinations:

  * `foo` `bar`
  * `user` `password`
  * `streng` `geheim`


    {
      "passwords": {
        "foo": ["sha256", "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9"],
        "user": ["sha256", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"],
        "streng": ["sha256", "addb0f5e7826c857d7376d1bd9bc33c0c544790a2eac96144a8af22b1298c940"]
      }
    }

## LDAP Lookup

LDAP is looked up using [DimensionSoftware/node-ldapauth](https://github.com/DimensionSoftware/node-ldapauth.git):

    {
      "ldap": {
        "url": "ldap://dev.marc.waeckerlin.org",
        "adminDn": "cn=tmp,ou=system,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
        "adminPassword": "secret",
        "searchBase": "ou=person,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
        "searchFilter": "(uid={{username}})"
      }
    }

## Combine Username Password and LDAP Lookup

If you combine username password and LDAP, then LDAP is used, if a username is not in the `"passwords"` map.

    {
      "passwords": {
        "foo": ["sha256", "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9"],
        "user": ["sha256", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"],
        "streng": ["sha256", "addb0f5e7826c857d7376d1bd9bc33c0c544790a2eac96144a8af22b1298c940"]
      },
      "ldap": {
        "url": "ldap://dev.marc.waeckerlin.org",
        "adminDn": "cn=tmp,ou=system,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
        "adminPassword": "secret",
        "searchBase": "ou=person,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
        "searchFilter": "(uid={{username}})"
      }
    }
