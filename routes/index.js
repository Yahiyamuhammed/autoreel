var express = require('express');
var router = express.Router();
var userHelpers = require ('../helpers/userhelpers')
const script=

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    res.render('index', { title: 'sdwakdens' });
    // res.render('../views/output');  

      console.log("User requested the route");

    // const script=await userHelpers.createInstaReelScript();
    // console.log("script =",script);
    // await userHelpers.voiceOverPython(script);
    // await userHelpers.compile();
    const downloadLink= await userHelpers.uploadToTransferSh()
    const creationId=await userHelpers.uploadToInstagram(downloadLink);
    userHelpers.publishToInstagram(creationId,downloadLink);

    const downloadLinkFacebook= await userHelpers.uploadToTransferSh()
    userHelpers.uploadToFacebook(downloadLinkFacebook);


      // Render the index view after video compilation
  } catch (error) {
      // Handle any errors that occur during fetchMedia or compileVideo
      console.error('Error:', error);
      next(error); // Pass the error to Express error handling middleware
  }
});

module.exports = router;
