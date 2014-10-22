var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    var username = req.session.username;
    if (username) {
        res.render('notes', {username: username});
        res.end();
        return;
    } else {
        res.render('index');
        return;
    }
});

module.exports = router;
