module.exports = function(config) {

  var crypto
  var LdapAuth
  var authentication
  
  if (config.passwords)
    crypto = require('crypto')
  if (config.ldap)
    LdapAuth = require('ldapjs')

  function search(auth, username, password, success, fail) {
    try {
      auth.search(config.ldap.searchBase, {
        scope: 'sub',
        filter: config.ldap.searchFilter.replace('{{username}}', username),
        attributes: ['dn']
      }, function(err, res) {
        if (err)
          return fail(username, 'ldap-search', err)
        try {
          res.on('searchEntry', function(entry) {
            auth.bind(entry.objectName, password, function(err) {
              if (err)
                return fail(username, 'ldap-authenticate', err)
              return success(username)
            })
          })
        } catch (e) {
          return fail(username, 'ldap-authenticate-exception', e)
        }
      })
    } catch (e) {
      return fail(username, 'ldap-search-exception', e)
    }
  }
  
  function bind(auth, username, password, success, fail) {
    if (config.ldap.bindDn&&config.ldap.bindPassword)
      try {
        auth.bind(config.ldap.bindDn, config.ldap.bindPassword, function(err) {
          if (err)
            return fail(username, 'ldap-bind', err)
          search(auth, username, password, success, fail)
        })
      } catch (e) {
        return fail(username, 'ldap-bind-exception', e)
      }
    else
      search(auth, username, password, success, fail)
  }
  if (config) {

    authentication = function (username, password, success, fail) {
      if (config.unrestricted)
        return success(username)
      if (!username)
        return fail(username, 'empty-username')
      if (config.passwords) {
        var userdata = config.passwords.find((item)=>{return item.user===username})
        if (userdata) {
          if (crypto.getHashes().indexOf(userdata.hash)>=0) {
            if (crypto.createHash(userdata.hash).update(password, 'utf8').digest('hex') === userdata.password) {
              return success(username)
            } else {
              return fail(username, 'password-authenticate')
            }
          } else {
            console.log('**** HASH NOT FOUND ****')
            console.log(config.passwords[username][0])
            console.log(crypto.getHashes())
            return fail(username, 'password-hash')
          }
        }
      }
      if (config.ldap) try {
        var auth = LdapAuth.createClient(config.ldap)
        if (config.ldap.starttls) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
          auth.starttls({}, [], function(err, res) {
            if (err)
              return fail(username, 'ldap-starttls', err)
            bind(auth, username, password, success, fail)
          })
        } else {
          bind(auth, username, password, success, fail)
        }
        return
      } catch (e) {
        return fail(username, 'ldap-exception', e)
      }
      return fail(username, 'restricted')
    }

  } else {

    authentication = function (username, password, success, fail) {
      console.log('**** Warning: no access configuration, no access granted.')
      return fail(username, 'configuration')
    }

  }

  return authentication

}
