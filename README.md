# NodeJS Authentication Module for Username-Password or LDAP

authenticate users either by ldap or username password, according to configuration

without configuration, access is unrestricted

example configuration

        {
          "passwords": {
            "foo": ["sha256", "fcde2b2edxx56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9"]
          },
          "ldap": {
            "url": "ldap://dev.marc.waeckerlin.org",
            "adminDn": "cn=tmp,ou=system,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
            "adminPassword": "secret",
            "searchBase": "ou=person,ou=people,dc=dev,dc=marc,dc=waeckerlin,dc=org",
            "searchFilter": "(uid={{username}})"
          }
        }
