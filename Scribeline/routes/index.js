var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    var username = req.session.username;
    if (username) {
        res.render('error', {error: "Node.js is an ass"});
    }
    res.render('index', { title: 'Express' });
});

module.exports = router;
