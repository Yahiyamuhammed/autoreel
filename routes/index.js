var express = require('express');
var router = express.Router();
var userHelpers = require ('../helpers/userhelpers')

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("user");
  userHelpers.fetchMedia('basil') 
  res.render('index', { title: 'sdwakdens' });
});

module.exports = router;
