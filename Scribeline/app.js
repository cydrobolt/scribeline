var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var sanitizeHtml = require('sanitize-html');
var session = require('express-session');
var crypto = require('crypto');
var app = express();
/*
 * Mongoose
*/
var mongoose = require('mongoose');
app.use(session({
    secret: 'lol cat'
}));


mongoose.connect('mongodb://localhost/scribeline');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("Connected to MongoDB server");
});
var User = mongoose.model('User', { username: String, password: String, email: String });
var Doc = mongoose.model('Doc', {_id: String, username: String, title: String, content: String});


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
function genHandleError(res, err) {
	res.render('error', {error: err});
}


app.use('/', routes);

app.post('/action-ep', function(req, res) {
    var username = req.session.username;
    if (req.param('action') == "save") {
        if (!username) {
            res.end();
            return;
        }
        var docTitle = req.param('title');
        var docContent = req.param('content');
        var docID = req.param('id');
        var d_id_rep = req.param('id');
        if (!docTitle || docTitle.length<1 || !docContent || docContent.length<1) {
            res.send('Error: Title/content cannot be blank. ');
            console.log(docTitle);
            res.end();
            return;
        }
        if (!docID || docID.length<1 || docID.length>1000) {
            res.send('Error: Invalid ID.');
            res.end();
        }
        if (docTitle.length>100) {
            res.send('Error: Title must be shorter than 100 characters.');
            res.end();
            return;
        }
        docContent = sanitizeHtml(docContent,
          {
          allowedTags: [ 'h1','h2','h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre' ],
          allowedAttributes: {
            a: [ 'href', 'name', 'target' ],
            // We don't currently allow img itself by default, but this
            // would make sense if we did
            img: [ 'src' ]
          },
          // Lots of these won't come up by default because we don't allow them
          selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
          // URL schemes we permit
          allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
          }
      ); // Sanitize
      try {
        d_id_rep = d_id_rep.replace(/[^a-z0-9]/gi,''); // Alphanum only
        docTitle = docTitle.replace(/[^a-z0-9 '_"@&^%$#!.,/]/gi,'');
    }
    catch (err) {
        console.log(err);
        return;
    }
        var saveDoc = new Doc({username: username, title: docTitle, content: docContent});
        var upsertDoc = saveDoc.toObject();
        delete upsertDoc._id;
        /*saveDoc.save(function (err) {
          if (err) {
              console.log("Error saving document: "+err);
              res.send('Error while saving document. Try again later');
          }
      });*/
  Doc.update({ _id: d_id_rep }, upsertDoc, {upsert: true}, function(err) {/*res.send('Error: Server cannot connect to database.');res.end();*/});
        res.send("OK")
        res.end();
        return;
    }
    else if (action == "getUserDocs") {
        // Get all of the user's outlines
        try {

        }
        catch (err) {
            res.send('No documents found. Perhaps you would like to create one?');
            res.end();
        }
    }
    else {
        res.send("Invalid action");
        res.end();
        return;
    }
});
app.get('/start', function(req, res) {
  res.render('start', { title: 'Scribeline' });
});
app.post('/signup', function(req, res) {
  var username = req.param('username');
  var password = req.param('password');
  var email = req.param('email');
  //res.send("Username: "+username+" <br /> Password: "+password+"<br />Email :"+email);
  var usernamea = username.replace(/[^a-z0-9]/gi,'');
  if (username.length != usernamea.length) {
      res.render('signup', {flash: "Only alphanumeric characters may be used in usernames."})
      return;
  }

  var newUser = new User({ username: usernamea, password: password,email: email });

  newUser.save(function (err) {
    if (err) {
		console.log("Error saving user: "+err);
	}
  });
  res.render('signin', { flash: "Registered!" });

});

app.get('/signin', function(req, res) {
    try {
        if(req.session.username) {
            res.writeHead(301,
                 {Location: '/'}
            );
            res.end();
            return;
        }
    }
    catch(err) {
        res.render('signin');
        return;
    }
	res.render('signin');
});
app.get('/logout', function(req, res) {
    req.session.username = null;
    res.writeHead(301,
         {Location: '/'}
    );
    res.end();
    return;
});
app.get('/plogin', function(req, res) {
    res.writeHead(301,
         {Location: '/signin'}
    );
    res.end();
});
app.post('/plogin', function(req, res) {
	var username = req.param('username');
	var password_s = req.param('password');

	// find each person with a last name matching 'Ghost', selecting the `name` and `occupation` fields
	User.findOne({ 'username': username }, 'password', function (err, user) {
	  if (err) return genHandleError(res, err);
      try {
    	  if (user.password == password_s) {
    		  // Woot, correct password
    		  req.session.username = username;
    		  res.writeHead(301,
         		  {Location: '/'}
        	  );
    	      res.end();
    	  }
      }
      catch (err) {
          res.render('signin', {flash: "Invalid User or Password"});
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
