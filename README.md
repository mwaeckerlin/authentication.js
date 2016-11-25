# NodeJS Authentication Module for Username-Password or LDAP

Authenticate users either by LDAP and/or username password, according to configuration. So you can have local users and LDAP users at the same time. If a a given user name is not in the list of local users, an LDAP lookup is started.

This allows you to have simple test systems and productive environments with LDAP user management on the same code base with only a different configuration file.

# Use In Code

The module returns a function that takes a username, a password, a function that is called if username and password match and a function that is called if authentication failed:

```javascript
function(username, password, success, fail);
```

## Server Side

To create an authenticated websocket connection, write something like:

```javascript
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
    // this is the function returned by the authentication.js library:
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
```
## Client Side

```html
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width initial-scale=1" />
    <script type="text/javascript" src="javascripts/jquery.js"></script>
    <script type="text/javascript" src="/socket.io/socket.io.js"></script>
    <script type="text/javascript" src="javascripts/myjavascript.js"></script>
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
```

```javascript
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
```

# Configuration

The sections, `"unrestricted"`, `"passwords"` and `"ldap"` are optional. Without configuration, access is completely blocked. To allow any user without restrictions, use:

```json
{
  "unrestricted": true
}
```

## Username Password

It is possible to define just a list of username an passwords. The passwords are stored in a hashed format. The hash algorithm can be anything that is supported by the [NodeJS Crypto Library](https://nodejs.org/api/crypto.html). The username password configuration is a map with the passwords as key and an array of first the hash type, then the hashed password.

This configuration uses SHA256 hash algorithm and stores the following usernames and password combinations:

  * `foo` `bar`
  * `user` `password`
  * `streng` `geheim`

```json
{
  "passwords": {
    "foo": ["sha256", "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9"],
    "user": ["sha256", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"],
    "streng": ["sha256", "addb0f5e7826c857d7376d1bd9bc33c0c544790a2eac96144a8af22b1298c940"]
  }
}
```

## LDAP Lookup

LDAP is looked up using [DimensionSoftware/node-ldapauth](https://github.com/DimensionSoftware/node-ldapauth.git):

```json
{
  "ldap": {
    "url": "ldap://dev.marc.waeckerlin.org",
    "adminDn": "cn=tmp,ou=system,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
    "adminPassword": "secret",
    "searchBase": "ou=person,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
    "searchFilter": "(uid={{username}})"
  }
}
```

## Combine Username Password and LDAP Lookup

If you combine username password and LDAP, first check for local users, then search on LDAP, so LDAP is used, if a username is not in the `"passwords"` map.

```json
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
```

# Tipps and Best Praxis

## Bootstrap Build Environment

I use the [GNU Build System](https://de.wikipedia.org/wiki/GNU_Build_System) bootstrapped from my [Bootstrap Build Environment](https://dev.marc.waeckerlin.org/redmine/projects/bootstrap-build-environment). This creates a `package.json.in` file that fills in important information into `package.json`, such as the path to the system configuration (normally `/etc`).

This is a `package.json.in` file:

```json
{
  "name": "@PACKAGE_NAME@",
  "version": "@PACKAGE_VERSION@",
  "private": true,
  "dependencies": {
    "express": "~2.5.8",
    "stylus": "~0.53.0",
    "ejs": ">= 0.0.1",
    "socket.io": "~1.4.4",
    "socketio-auth": "0.0.5",
    "authentication.js": ">= 1.0.0",
    "docker.js": ">= 0.2.4"
  },
  "description": "@DESCRIPTION@",
  "main": "@PACKAGE_NAME@.js",
  "devDependencies": {},
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "@AUTHOR@",
  "license": "@LICENSE@",
  "path": {
      "prefix": "@PREFIX@",
      "sysconf": "@SYSCONFDIR@",
      "pkgdata": "@PKGDATADIR@",
      "localstate": "@LOCALSTATEDIR@",
      "log": "@LOCALSTATEDIR@/log/@PACKAGE_NAME@.log",
      "config":  "@SYSCONFDIR@/@PACKAGE_NAME@.json",
      "nodejs": "@PKGDATADIR@/nodejs"
  }
}
```

Then this is a possible `package.json` file derieved from the above `package.json.in`:

```json
{
  "name": "servicedock",
  "version": "0.9.28",
  "private": true,
  "dependencies": {
    "express": "~2.5.8",
    "stylus": "~0.53.0",
    "ejs": ">= 0.0.1",
    "socket.io": "~1.4.4",
    "socketio-auth": "0.0.5",
    "authentication.js": ">= 1.0.0",
    "docker.js": ">= 0.2.4"
  },
  "description": "ServiceDock https://servicedock.ch",
  "main": "servicedock.js",
  "devDependencies": {},
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Marc Wäckerlin (https://marc.wäckerlin.ch) <marc@waeckerlin.org>",
  "license": "GNU GENERAL PUBLIC LICENSE",
  "path": {
      "prefix": "/usr/local",
      "sysconf": "/usr/local/etc",
      "pkgdata": "/usr/local/share/servicedock",
      "localstate": "/usr/local/var",
      "log": "/usr/local/var/log/servicedock.log",
      "config":  "/usr/local/etc/servicedock.json",
      "nodejs": "/usr/local/share/servicedock/nodejs"
  }
}
```

In the project's main javascript file, I include the `package.json` file, e.g. to retrieve the path to the system's configuration file:

```javascript
var package = require(__dirname+'/package.json');
var config = require(package.path.config);
```

## Configuration File

Often you want to have more configurations in the configuration file, then only the authentication.js' configurations. I always add a configuration option for setting the port, since I cannot predict an which ports the users of my code want to run my application. So I add the configuration for authentication.js in `"restrict"`, e.g.:

```javascript
{
  "port": 8888,
  "restrict": {
    "passwords": {
      "foo": ["sha256", "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9"]
    }
  }
}
```

In addition, I allow to overwrite the port by specifying a port number on the command line. Then, together with loading of the configuration file as explained above, my initialisation code looks like this:

```javascript
var package = require(__dirname+'/package.json');
var config = require(package.path.config);
var authentication = require('authentication.js')(config.restrict);

// Configuration
process.argv.forEach(function(val, index) {
  if (index<2) {return}
  if (index!=2 || isNaN(val)) {
    console.log("**** ERROR: Unexpected Argument - allowed is only a port number");
    process.exit(1);
  }
  config.port = parseInt(val);
});
if (typeof config.port != 'number') {
  console.log("**** WARNING: no valid port given, defaults to 8888");
  config.port = 8888;
}
  
app.listen(config.port, function() {
  console.log("Express server listening on port %d in %s mode",
              app.address().port, app.settings.env);
});
```
