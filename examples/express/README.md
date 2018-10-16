Example Authentication Using Express
====================================

Project has been initialized using:

```bash
express -c stylus examples/express
cd examples/express
npm install --save fs
npm install
```

Start the example by running: `npm start`, then head your browser to `http://localhost:3000`.

Most files and lines have been created by the express initialization. Everything added for the example has one of the comments:

    //**** ADDED FOR AUTHENTICATION EXAMPLE ****//
    
    <!---- ADDED FOR AUTHENTICATION EXAMPLE ---->

Up to:

    //**** END AUTHENTICATION EXAMPLE ****//
    
    <!---- END AUTHENTICATION EXAMPLE ---->


Routing
-------

Normally, you would add routing to subdir `./routes/`, but for this simple example, it is sufficient to add the following in `./app.js`:

```javascript
//**** ADDED FOR AUTHENTICATION EXAMPLE ****//
var config = JSON.parse(require('fs').readFileSync('./config/authentication.js'))
var authentication = require('../../index.js')(config)
app.post('/verify', function(req, res) {
  try {
    authentication(req.body.username, req.body.password,
                   (user) => {
                     res.render('verify', {
                       title: 'Authenticated',
                       result: 'success: user "'+user+'" logged in'
                     })
                   },
                   (user, msg) => {
                     res.render('verify', {
                       title: 'Failed',
                       result: 'failed: no user "'+user+'" or wrong password, '+msg
                     })
                   })
  } catch (e) {
    res.render('verify', {
      title: 'Exception',
      result: 'exception: '+e
    })
  }
})
//**** END AUTHENTICATION EXAMPLE ****//
```

Of course, you would not access `../../index.js`, but add the module using `npm install --save authentication.js`, then write:

```javascript
var authentication = require('authentication.js')(config)
```


Views
-----

You need a form, where the user inputs username and password, so add the following lines to `./views/index.jade`:

```javascript
  h2 Login
  form(action='/verify', method='post')
    input(placeholder='username', name='username', id='username', type='text')
    input(placeholder='password', name='password', id='password', type='password')
    input(type='submit')
```

To show the result, `app.js` renders `verify`, so create a new file `./views/verify.js`:

```javascript
extends layout

block content
  h1= title
  p verify user login, result: #{result}
```


Configuration
-------------

Create a configuration file `./config/authentication.js`, with user `hello` and password `world`, and another user with name `foo` and password `bar`. Get the password hashes using:

    echo -n "world" | sha256sum
    echo -n "bar"   | sha256sum

This is the configuration file `./config/authentication.js`:

```javascript
{
  "passwords": [
    {
      "user": "hello",
      "hash": "sha256",
      "password": "486ea46224d1bb4fb680f34f7c9ad96a8f24ec88be73ea8e5a6c65260e9cb8a7"
    },
    {
      "user": "foo",
      "hash": "sha256",
      "password": "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9"
    }
  ]
}

```
