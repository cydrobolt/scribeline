var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    var username = req.session.username;
    if (username && username != null && username.length>0) {
        res.render('notes', {username: username, show_footer: "True"});
        res.end;
        return;
    } else {
        res.render('index', {hide_footer: "True"});
        return;
    }
});

module.exports = router;
