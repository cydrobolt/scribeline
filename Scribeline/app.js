var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('cookie-session')
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
/*
 * Mongoose
*/
var mongoose = require('mongoose');

app.use(session({
  keys: ['abbb3324234', 'aeraweorq39847lkajer79234'],
  secureProxy: true // if you do SSL outside of node
}))


mongoose.connect('mongodb://localhost/scribeline');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("Connected to MongoDB server");
});
var User = mongoose.model('User', { username: String, password: String, email: String });

// var kitty = new Cat({ name: 'Zildjian' });
/*
kitty.save(function (err) {
  if (err) // ...
  console.log('meow');
});
*/
/*
 * /Mongoose
*/


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
 * Routings
 *
*/



app.use('/', routes);
app.get('/start', function(req, res) {
  res.render('start', { title: 'Scribeline' });
});
app.post('/signup', function(req, res) {
  var username = req.param('username');
  var password = req.param('password');
  var email = req.param('email');
  //res.send("Username: "+username+" <br /> Password: "+password+"<br />Email :"+email);
  
  
  var newUser = new User({ username: username, password: password,email: email });

  newUser.save(function (err) {
    if (err) {
		console.log("Error saving user: "+err);
	}
  });
  res.render('login', { flash: "Registered!" });

});
app.post('/plogin', function(req, res) {
	var username = req.param('username');
	var password_s = req.param('password');

	// find each person with a last name matching 'Ghost', selecting the `name` and `occupation` fields
	User.findOne({ 'username': username }, 'password', function (err, user) {
	  if (err) return handleError(err);
	  if (password == password_s) {
		  // Woot, correct password
		  req.session.username = username;
		  response.writeHead(301,
     		  {Location: '/'}
    	  );
	      response.end();
	  }
		  
	});
  
});


/*
 * End routings
*/

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
