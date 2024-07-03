var express = require('express');
var router = express.Router();
var userHelpers = require ('../helpers/userhelpers')


/* GET users listing. */





router.get('/', function(req, res, next) {
 

  console.log("user");
  userHelpers.fetchMedia('basil') 
  res.send('respond with a dasdeuk  dasdsa resource');
  
});

module.exports = router;
