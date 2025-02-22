var express = require('express');
var router = express.Router();
var userHelpers = require ('../helpers/userhelpers')
// const script=

/* GET home page. */
router.get('/',(req,res)=>{
  res.render('home-page')
})
// Step 1: One-click publish - Generate the script, video and publish it
router.post('/reel/publish', async (req, res, next) => {
  try {
    // Step 1a: Create the script for the reel
    const script = await userHelpers.createInstaReelScript();
    console.log('Generated Script:', script);

    // // Step 1b: Generate the video based on the script
    // const videoLink = await userHelpers.createReelVideo(script);
    // console.log('Generated Video Link:', videoLink);

    // // Step 1c: Upload to Transfer.sh (or any file hosting platform)
    // const downloadLink = await userHelpers.uploadToTransferSh(videoLink);
    // console.log('Download Link:', downloadLink);

    // // Step 1d: Upload to Instagram (or another social media platform)
    // const creationId = await userHelpers.uploadToInstagram(downloadLink);
    // console.log('Instagram Creation ID:', creationId);

    // // Step 1e: Publish the video on Instagram
    // await userHelpers.publishToInstagram(creationId, downloadLink);
    console.log('Reel Published on Instagram');

    // Respond with the generated script to proceed with the review step
    res.json({ message: 'Reel generation started!', script });
  } catch (error) {
    console.error('Error during reel generation:', error);
    next(error); // Pass the error to Express error handling middleware
  }
});


// Step 2: Accept the script
router.post('/reel/accept-script', async (req, res, next) => {
  try {
    const { script } = req.body;
    console.log('Script Accepted:', script);

    // You can save the accepted script in the database if needed
    // await userHelpers.saveScriptToDatabase(script);

    // Proceed to video generation
    // const videoLink = await userHelpers.createReelVideo(script);
    await userHelpers.voiceOverPython(script);
    const videoLink= await userHelpers.compile();
    console.log('video link',videoLink);
    

    res.json({ message: 'Script accepted, video is now being generated.', videoLink });
  } catch (error) {
    console.error('Error accepting script:', error);
    next(error);
  }
});


router.post('/reel/regenerate-video', async (req, res, next) => {
  try {
    // Regenerate the video based on the script
    // const videoLink = await userHelpers.createReelVideo();
    // await userHelpers.voiceOverPython('script');
    // const videoLink= await userHelpers.compile();
    const videoLink='D:\programming\ai\public\videos\output.mp4'
    console.log('Regenerated Video:', videoLink);
    res.json({ message: 'Video regenerated!', videoLink });
  } catch (error) {
    console.error('Error regenerating video:', error);
    next(error);
  }
});


// Step 3: Regenerate the script
router.post('/reel/regenerate-script', async (req, res, next) => {
  try {
    // Regenerate the script for the reel
    const script = await userHelpers.createInstaReelScript();
    console.log('Regenerated Script:', script);
    res.json({ message: 'Script regenerated!', script });
  } catch (error) {
    console.error('Error regenerating script:', error);
    next(error);
  }
});


router.get('/reel', async function(req, res, next) {
  try {
    res.render('index', { title: 'welcome' });
    // res.render('../views/output');  

      console.log("User requested the route");

    const script=await userHelpers.createInstaReelScript();
    console.log("script =",script);
    // const script=" Attention, seekers of grandeur! Did you know that the rarest gemstone in the world is so rare that only a few hundred carats have ever been discovered? This extraordinary rarity mirrors the potential within you – a treasure awaiting discovery. Embrace your refined essence and strive for excellence. Remember, a luxurious lifestyle is not merely about material possessions but about cultivating an exquisite mindset. Seek knowledge, surround yourself with inspiration, and elevate your daily rituals. The true luxury lies in living a life infused with purpose and limitless potential. Follow for more insights and inspiration on reaching your highest self!";
    await userHelpers.voiceOverPython(script);
    await userHelpers.compile();
    const downloadLink= await userHelpers.uploadToTransferSh()
    // // const downloadLink= "https://files.catbox.moe/0eonag.mp4"
    console.log('download link : ',downloadLink);
    
    const creationId=await userHelpers.uploadToInstagram(downloadLink);
    userHelpers.publishToInstagram(creationId,downloadLink);

    // const downloadLinkFacebook= await userHelpers.uploadToTransferSh()
    // userHelpers.uploadToFacebook(downloadLinkFacebook);


      // Render the index view after video compilation
  } catch (error) {
      // Handle any errors that occur during fetchMedia or compileVideo
      console.error('Error:', error);
      next(error); // Pass the error to Express error handling middleware
  }
});

module.exports = router;
