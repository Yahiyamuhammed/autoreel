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

      // Fetch images asynchronously
      // const images = await userHelpers.fetchMedia('basil');
      // console.log("images link",images);
      // console.log("images ==",images);

      // Compile video using fetched images
      // await userHelpers.compile( );

       // Create script asynchronously
    // const script = await userHelpers.createInstaReelScript('basil');
    // Generate voiceover from script asynchronously
    // await userHelpers.generateVoiceOverFromScript(" Did you know that 20% of people admit to procrastinating more than half of their work tasks? If you're one of them, don't worry! You can overcome procrastination by breaking down tasks into smaller chunks. Start with the easiest one today, and you'll be surprised how quickly you make progress. Remember, procrastination is just a habit, and like any habit, you can break it with consistency and determination. So, what are you waiting for? Embrace the power of action today!");
    // await userHelpers.voiceoverNew("Create a 30-second script for an Instagram Reel about travel tips ");
    // await userHelpers.tts();
    // userHelpers.testapi();
    const script=await userHelpers.createInstaReelScript();
    console.log("script =",script);
    

    await userHelpers.voiceOverPython(script);
    await userHelpers.compile();
    const downloadLink= await userHelpers.uploadToTransferSh()
    const creationId=await userHelpers.uploadToInstagram(downloadLink);
    await userHelpers.publishToInstagram(creationId,downloadLink);

    // userHelpers.srt();


      // Render the index view after video compilation
  } catch (error) {
      // Handle any errors that occur during fetchMedia or compileVideo
      console.error('Error:', error);
      next(error); // Pass the error to Express error handling middleware
  }
});

module.exports = router;
