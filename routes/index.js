var express = require('express');
var router = express.Router();
var userHelpers = require ('../helpers/userhelpers')

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    res.render('index', { title: 'sdwakdens' });
    // res.render('../views/output');  

      console.log("User requested the route");

      // Fetch images asynchronously
      const images = await userHelpers.fetchMedia('basil');
      // console.log("images ==",images);

      // Compile video using fetched images
      await userHelpers.compileVideo(images );

      // Render the index view after video compilation
  } catch (error) {
      // Handle any errors that occur during fetchMedia or compileVideo
      console.error('Error:', error);
      next(error); // Pass the error to Express error handling middleware
  }
});

module.exports = router;
