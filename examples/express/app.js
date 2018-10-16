var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

//**** ADDED FOR AUTHENTICATION EXAMPLE ****//
var config = JSON.parse(require('fs').readFileSync('./config/authentication.js'))
// since we are within the project, we require local file: ../../index.js
// in your project, you would use: npm install authentication.js
// then you would define: var authentication = require('authentication.js')(config)
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

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
