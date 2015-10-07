/*
#
# Scribeline Note Editor
# http:..github.com/cydrobolt/scribeline
#
# Copyright 2015 Chaoyi Zha
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
*/

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var sanitizeHtml = require('sanitize-html');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var app = express();
var mongoose = require('mongoose');
var config = require('./config.json');
console.log("Starting Scribeline server");

var buf = crypto.randomBytes(128);
var random_session_key = buf.toString('hex');

app.use(session({
    secret: random_session_key
}));

mongoose.connect(config.mongoConnect);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log("Connected to MongoDB server");
});
var User = mongoose.model('User', {
    username: String,
    password: String,
    email: String,
    iters: Number,
    user_theme: String,
    salt: String
});
var Doc = mongoose.model('Doc', {
    _id: String,
    username: String,
    title: String,
    content: String,
    created: Number
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function genHandleError(res, err) {
    res.render('error', {
        error: err
    });
}


app.use('/', routes);

app.post('/action-ep', function(req, res) {
    var username = req.session.username;
    action = req.param('action');
    if (action == "save") {
        if (!username) {
            res.end();
            return;
        }
        var docTitle = req.param('title');
        var docContent = req.param('content');
        var d_id_rep = req.param('id');
        if (!docTitle || docTitle.length < 1 || !docContent || docContent.length < 1) {
            res.send('Error: Title/content cannot be blank. ');
            res.end();
            return;
        }
        if (!d_id_rep || d_id_rep.length < 1 || d_id_rep.length > 1000) {
            res.send('Error: Invalid ID.');
            res.end();
            return;
        }
        if (docTitle.length > 100) {
            res.send('Error: Title must be shorter than 100 characters.');
            res.end();
            return;
        }
        docContent = sanitizeHtml(docContent, {
            allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'blockquote', 'p', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 's', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'],
            allowedAttributes: {
                a: ['href', 'name', 'target'],
                // We don't currently allow img itself by default, but this
                // would make sense if we did
                img: ['src', 'style']
            },
            // Lots of these won't come up by default because we don't allow them
            selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
            // URL schemes we permit
            allowedSchemes: ['http', 'https', 'ftp', 'mailto']
        }); // Sanitize
        try {
            d_id_rep = d_id_rep.replace(/[^a-z0-9]/gi, ''); // Alphanum only
            docTitle = docTitle.replace(/[^a-z0-9 '_"@&^%$#!.,/]/gi, '');
        } catch (err) {
            res.send("Could not sanitise string...");
            return;
        }
        unix_timestamp = Date.now() / 1000 | 0; // Create UNIX timestamp
        var saveDoc = new Doc({
            username: username,
            title: docTitle,
            content: docContent,
            created: unix_timestamp
        });
        var upsertDoc = saveDoc.toObject();
        delete upsertDoc._id;

        Doc.update({
            _id: d_id_rep
        }, upsertDoc, {
            upsert: true
        }, function(err) {});
        res.send("OK");
        res.end();
        return;
    } else if (action == "deleteUserDoc") {
        var d_id = req.param("id");
        try {
            Doc.remove({
                _id: d_id,
                username: username
            }, function(err) {
                if (err) {
                    res.send("ERROR");
                    res.end();
                    return;
                } else {
                    res.send("OK");
                    res.end();
                    return;
                }
            });
        } catch (err) {
            res.send('ERROR');
            res.end();
            return;
        }
    } else if (action == "getUserDocs") {
        // Get all of the user's documents
        try {
            Doc.find({
                username: username
            }, function(err, dobj) {
                var map = dobj.map(function(s) {
                    return {
                        '_id': s._id,
                        'title': s.title,
                        'timestamp': s.created
                    };
                });
                map = JSON.stringify(map);
                res.send(map);
                res.end();
                return;
            });
        } catch (err) {
            res.send('No documents found. Perhaps you would like to create one?');
            res.end();
            return;
        }
    } else if (action == "getDoc") {
        var toGetID = req.param('id');

        // Get corresponding document
        try {
            Doc.findOne({
                _id: toGetID,
                username: username
            }, 'content', function(err, dobj) {
                if (err) {
                    res.send('ERROR');
                    res.end();
                    return;
                }
                try {
                    var content = dobj.content;

                } catch (err) {
                    res.send('ERROR');
                    res.end();
                    return;
                }
                if (!content || content.length < 1) {
                    res.send('ERROR');
                    res.end();
                    return;
                }
                res.send(content);
                res.end();
                return;
            });
        } catch (err) {
            res.send(err);
            res.end();
            return;
        }
    } else {
        res.send("Invalid action");
        res.end();
        return;
    }
});

app.get('/start', function(req, res) {
    res.render('start', {
        title: 'Scribeline'
    });
});
app.post('/signup', function(req, res) {
    var username = req.param('username');
    var password = req.param('password');


    var email = req.param('email');
    var usernamea = username.replace(/[^a-z0-9]/gi, '');
    if (username.length != usernamea.length) {
        res.render('start', {
            flash: "Only alphanumeric characters may be used in usernames."
        });
        res.end();
        return;
    }
    var emaila = email.replace(/[^a-z0-9@._-]/gi, '');
    if (email.length != emaila.length) {
        res.render('start', {
            flash: "Invalid email. "
        });
        res.end();
        return;
    }
    if (password.length > 90) {
        res.render('start', {
            flash: "Password length must be under 90."
        });
        res.end();
        return;
    }


    var salt = bcrypt.genSaltSync(10);

    var hashedpw = bcrypt.hashSync(password, salt);
    var newUser = new User({
        username: usernamea,
        password: hashedpw,
        email: emaila,
        salt: salt,
        user_theme: ""
    });
    User.count({
        username: username
    }, function(err, count) {
        if (!count) {
            newUser.save(function(err) {
                if (err) {
                    res.render('signin', {
                        flash: "Could not register. Try again later. "
                    });
                }
                res.render('signin', {
                    flash: "Registered!"
                });
            });
        } else {
            res.render('start', {
                flash: "User already registered."
            });
            res.end();
            return;
        }
    });


});

app.get('/signin', function(req, res) {
    try {
        if (req.session.username) {
            res.writeHead(301, {
                Location: '/'
            });
            res.end();
            return;
        }
    } catch (err) {
        res.render('signin');
        return;
    }
    res.render('signin');
});
app.get('/logout', function(req, res) {
    req.session.username = null;
    req.session.user_theme = null;
    res.writeHead(301, {
        Location: '/'
    });
    res.end();
    return;
});
app.get('/plogin', function(req, res) {
    res.writeHead(301, {
        Location: '/signin'
    });
    res.end();
    return;
});
app.get('/set-theme', function(req, res) {
    var themeArray = ["", "superhero", "sandstone", "simplex", "readable", "paper", "flatly"];
    var username = req.session.username;
    if (!username) {
        res.writeHead(301, {
            Location: '/signin'
        });
        res.end();
        return;
    }
    var theme = req.query.theme;
    if (themeArray.indexOf(theme) < 0) {
        res.render("error", {
            "message": "Invalid theme provided."
        });
        res.end();
        return;
    }

    var saveUser = new User({
        user_theme: theme
    });
    var updateUser = saveUser.toObject();
    delete updateUser._id;
    User.update({
        username: username
    }, updateUser, {
        upsert: true
    }, function(err) {});
    req.session.user_theme = theme;

    res.writeHead(301, {
        Location: '/'
    });
    res.end();
    return;
});
app.post('/plogin', function(req, res) {
    var username = req.param('username');
    var password_s = req.param('password');

    User.findOne({
        'username': username
    }, 'password iters salt user_theme', function(err, user) {
        if (err) return genHandleError(res, err);
        try {
            var salt = user.salt;
            if (bcrypt.compareSync(password_s, user.password)) {
                // correct password located
                req.session.username = username;
                try {
                    req.session.user_theme = user.user_theme;
                } catch (err) {
                    req.session.user_theme = null;
                }
                res.writeHead(301, {
                    Location: '/'
                });
                res.end();
                return;
            } else {
                res.render('signin', {
                    flash: "Invalid User or Password"
                });
                res.end();
                return;
            }
        } catch (err) {
            res.render('signin', {
                flash: "Invalid User or Password"
            });
        }

    });

});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (config.env === 'development') {
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

app.listen(config.listenPort, config.listenHost);
module.exports = app;
