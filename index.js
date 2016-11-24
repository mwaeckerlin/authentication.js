module.exports = function(config) {

  var crypto = require('crypto');
  var LdapAuth = require('ldapauth');
  var authentication;
  
  if (config) {
    
    authentication = function (username, password, success, fail) {

      console.log("...try: ", username);
      if (config.passwords && config.passwords[username]) {
        console.log("...check hash");
        if (crypto.getHashes().indexOf(config.passwords[username][0])>=0) {
          if (crypto.createHash(config.passwords[username][0]).update(password, 'utf8').digest('hex') === config.passwords[username][1]) {
            success(username);
            return;
          } else {
            fail(username);
            return;
          }
        } else {
          console.log("**** HASH NOT FOUND ****");
          console.log(config.passwords[username][0]);
          console.log(crypto.getHashes());
          fail(username);
          return;
        }
      }
      if (config.ldap) try {
        console.log("...check ldap");
        var auth = new LdapAuth(config.ldap);
        auth.once('connect', function () {
          try {
            auth.authenticate(username, password, function(err, usr) {
              auth.close(function(err) {})
              if (err) {
                console.log("**** ERROR: LDAP Authentication failed:", err);
                fail(username);
                return;
              }
              console.log("**** SUCCESS: LDAP Authentication:");
              success(username);
              return;
            });
          } catch (e) {
            console.log("**** Error: LDAP failed: ", e, e.stack);
            fail(username);
          }
          return; // need to block here!
        });
      } catch (e) {
        console.log("**** Error: LDAP failed: ", e, e.stack);
        fail(username);
        return;
      }
      if (config.unrestricted)
        success(username);
      else
        fail(username);
      return;
    }

  } else {

    authentication = function (username, password, success, fail) {
      console.log('**** Warning: no access configuration, no access granted.')
      fail(username);
    }

  }

  return authentication;

}
