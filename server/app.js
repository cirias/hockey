var express = require('express');
var path = require('path');
var logger = require('morgan');
var compress = require('compression');

var routes = require('./routes.js');

var app = express();

app.use(compress());

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, '../public')));

// app.use('/api', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err.stack
    });
  });
}
else {
// production error handler
// no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err.stack
    });
  });
}

module.exports = app;
