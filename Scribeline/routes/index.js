var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    var user_theme = req.session.user_theme || null;
    var username = req.session.username;
    console.log(username);
    if (username && username !== null && username.length > 0) {
        res.render('notes', {username: username, show_footer: "True", user_theme: user_theme});
        res.end();
        return;
    } else {
        res.render('index', {hide_footer: "True"});
        return;
    }
});

module.exports = router;
