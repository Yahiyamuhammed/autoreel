// maryttsClient.js
const MaryTTS = require('@fonoster/marytts');

// Configure the MaryTTS client
const mary = new MaryTTS({
    url: 'http://marytts.phonetik.uni-muenchen.de:59125/process',
  host: 'localhost',
  port: 59125, // Default port for MaryTTS
  locale: 'en_US',
  voice: 'cmu-slt-hsmm' // You can change this to the voice you prefer
});
console.log("TTS HOSTED");


// Export the configured MaryTTS client
module.exports = mary;
