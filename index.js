module.exports = function(config) {

  var crypto = require('crypto');
  var LdapAuth = require('ldapjs');
  var authentication;

  function search(auth, username, password, success, fail) {
    var res = auth.search(config.ldap.searchBase, {
      scope: 'sub',
      filter: config.ldap.searchFilter.replace('{{username}}', username),
      attributes: ['dn']
    }, function(err, res) {
        if (err) return fail(username, 'ldap-search', err);
      res.on('searchEntry', function(entry) {
        console.log(entry.objectName)
        auth.bind(entry.objectName, password, function(err) {
          if (err) return fail(username, 'ldap-authenticate', err);
          return success(username)
        })
      })
    })
  }
  
  function bind(auth, username, password, success, fail) {
    if (config.ldap.bindDn&&config.ldap.bindPassword)
      auth.bind(config.ldap.bindDn, config.ldap.bindPassword, function(err) {
        if (err) return fail(username, 'ldap-bind', err);
        search(auth, username, password, success, fail)
      });
    else
      search(auth, username, password, success, fail);
  }
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
            fail(username, 'password-authenticate');
            return;
          }
        } else {
          console.log("**** HASH NOT FOUND ****");
          console.log(config.passwords[username][0]);
          console.log(crypto.getHashes());
          fail(username, 'password-hash');
          return;
        }
      }
      if (config.ldap) try {
        console.log("...check ldap");
        var auth = LdapAuth.createClient(config.ldap);
        if (config.ldap.starttls) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
          auth.starttls({}, [], function(err, res) {
            if (err) return fail(username, 'ldap-starttls', err);
            bind(auth, username, password, success, fail)
          })
        } else {
          bind(auth, username, password, success, fail)
        }
        return
      } catch (e) {
        fail(username, 'ldap-exception', e);
      }
      if (config.unrestricted)
        return success(username);
      else
        return fail(username, 'restricted');
    }

  } else {

    authentication = function (username, password, success, fail) {
      console.log('**** Warning: no access configuration, no access granted.')
      return fail(username, 'configuration');
    }

  }

  return authentication;

}
