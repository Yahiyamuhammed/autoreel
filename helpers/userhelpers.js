require('dotenv').config();
// import OpenAI from "openai";
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { compile } = require('morgan');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const gtts = require('node-gtts')('en');
const { exec } = require('child_process');


const mary = require('../configurations/tts');
// const fs = require('fs');

const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient();

// const espeak = require('espeak');
// import ESpeakNg from 'espeak-ng';








const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "http://localhost:3040/v1",
     // Ensure your .env file contains the correct API key
});



const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const GOOGLE_GEMINI_API_KEY=process.env.GOOGLE_GEMINI_API_KEY


const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);

module.exports={

     fetchFromPexels: (query) => {
        return new Promise(async (resolve, reject) => {
            console.log("got helpers");
            const imageUrl = `https://api.pexels.com/v1/search?query=${query}&per_page=2`;
            const videoUrl = `https://api.pexels.com/videos/search?query=${query}&per_page=2`;
            try {
                const imageResponse = await axios.get(imageUrl, {
                    headers: {
                        Authorization: PEXELS_API_KEY
                    }
                });
                const videoResponse = await axios.get(videoUrl, {
                    headers: {
                        Authorization: PEXELS_API_KEY
                    }
                });
                resolve({
                    photos: imageResponse.data.photos,
                    videos: videoResponse.data.videos
                });
            } catch (error) {
                reject(error);
            }
        });
    },    

     fetchFromPixabay : (query) => {
        return new Promise(async (resolve, reject) => {
            const imageUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${query}&image_type=photo&per_page=3`;
            const videoUrl = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${query}&per_page=3`;
            try {
                const imageResponse = await axios.get(imageUrl);
                const videoResponse = await axios.get(videoUrl);
                // Limit the number of image links to 2
            const limitedPhotos = imageResponse.data.hits.slice(0, 2);
            const limitedVIdeos = videoResponse.data.hits.slice(0, 2);

                resolve({
                    // photos: imageResponse.data.hits,
                    photos: limitedPhotos,
                    videos: limitedVIdeos
                });
            } catch (error) {
                reject(error);
            }
        });
    },    


fetchMedia: (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pexelsData = await module.exports.fetchFromPexels(query);
            const pixabayData = await module.exports.fetchFromPixabay(query);

            const photos = [
                ...pexelsData.photos.map(photo => ({ src: photo.src.original, source: 'Pexels' })),
                ...pixabayData.photos.map(photo => ({ src: photo.largeImageURL, source: 'Pixabay' }))
            ];

            const videos = [
                ...pexelsData.videos.map(video => ({ src: video.video_files[0].link, source: 'Pexels' })),
                ...pixabayData.videos.map(video => ({ src: video.videos.medium.url, source: 'Pixabay' }))
            ];

            const media = [...photos, ...videos];
            console.log(Array.isArray(media)); // Should output true if media is an array

            resolve(media.map(item => item.src));
        } catch (error) {
            console.error('Error fetching media:', error);
            reject(error);
        }
    });
},

 downloadImage :  (url, filepath) => {
    
    return new Promise(async(resolve, reject) => {
        try {
            const response = await axios({
                url,
                responseType: 'stream',
            });
    
            console.log("file path =",filepath);
            // Extract the file extension from the URL
            const urlParts = url.split('.');
            const fileExtension = urlParts[urlParts.length - 1];
            const fileparts=filepath.split('.')
            // Get the directory path (excluding the filename and extension)
            const directoryPath = fileparts.slice(0, fileparts.length - 1).join('\\');
            console.log('directoryPath',directoryPath);

            // Get the filename (including the extension)
            const fileIndex = fileparts.pop();
            console.log('fileName',fileIndex);


            console.log("file path split ==",fileparts);
            let updatedFilepath = filepath;
    
            // Append the file extension to the filepathif
            if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
                {updatedFilepath = `${directoryPath}image${fileIndex}.jpg`;
                console.log('updated =',updatedFilepath);}
            } else if (fileExtension === 'mp4') {
                updatedFilepath = `${directoryPath}video${fileIndex}.mp4`;
            }

            // const filename = path.basename(filepath);
            // const updatedFilepath = path.join(path.dirname(filepath), `${filename}.${fileExtension}`);
    
            response.data.pipe(fs.createWriteStream(updatedFilepath))
                .on('finish', () => {
                    console.log(`Image downloaded and saved to ${updatedFilepath}`);
                    resolve()

                })
                .on('error', (err) => {
                    console.error('Error downloading image:', err);
                });
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    });
},


compile:()=>{
    return new Promise(async(resolve,reject) =>
        {

            const imagesDir = path.join(__dirname, '../public/images');

            console.log("dowload started");
            // Download all images
            // const imagePaths = await Promise.all(images.map(async (url, index) => {
            //     const imagePath = path.join(imagesDir, `.${index + 1}`);
            //     await module.exports.downloadImage(url, imagePath);
            //     return imagePath;
            // }));
                // Assuming you want to remove all relative path components from `__dirname`
                const outputVideoPath = path.join('public/videos', 'output.mp4'); 
                // const outputVideoPath ='output.mp4'
                console.log(outputVideoPath);

                const mediaFolder = path.join(__dirname, '../public/images');

                // Get image and video files
                const imageFiles = fs.readdirSync(mediaFolder).filter(file => file.match(/^image\d+\.jpg$/));
                const videoFiles = fs.readdirSync(mediaFolder).filter(file => file.match(/^video\d+\.mp4$/));

                // Create a new ffmpeg command
                const command = ffmpeg();

                // Add image inputs with loop and framerate options
                imageFiles.forEach(image => {
                    command.input(path.join(mediaFolder, image)).inputOptions(['-loop 1', '-framerate 24', '-t 1']);
                });

                // Add video inputs
                videoFiles.forEach(video => {
                    command.input(path.join(mediaFolder, video));
                });

                
                // Construct the filter_complex and map options
                const filterComplex = [];
                const mapOptions = [];

                imageFiles.concat(videoFiles).forEach((file, index) => {
                    filterComplex.push(`[${index}:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1[v${index}]`);
                    mapOptions.push(`[v${index}]`);
                });

                filterComplex.push(`${mapOptions.join('')}concat=n=${imageFiles.length + videoFiles.length}:v=1:a=0[outv]`);

                command
                    .complexFilter(filterComplex)
                    .map('[outv]')
                    .output(outputVideoPath)
                    .on('start', (commandLine) => {
                        console.log('Spawned FFmpeg with command: ' + commandLine);
                    })
                    .on('progress', (progress) => {
                        console.log('Processing: ' + JSON.stringify(progress) + '% done');
                    })
                    .on('end', () => {
                        console.log('Video compilation finished!');
                    })
                    .on('error', (err) => {
                        console.error('Error during video compilation:', err);
                    })
                    .run();

         } )
},
createInstagramReelScript : (topic) => {
    return new Promise(async (resolve, reject) => {
        console.log("entered prompt");
        const prompt = `Create a script for an Instagram reel about "${topic}". The script should be engaging, suitable for a voice-over, and last around 30 seconds.`;

        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: `Create a script for an Instagram reel about "${topic}". The script should be engaging, suitable for a voice-over, and last around 30 seconds.` }],
                model: "gpt-3.5-turbo", 
            });
    
            const script = completion.choices[0].message.content.trim();
            console.log("Generated Script: ", script);
            return script;
        } catch (error) {
            console.error("Error generating script: ", error);
            throw error;
        }

    })
},

createInstaReelScript : (topic) => {
    return new Promise(async (resolve, reject) => {

        console.log("Entered prompt");
        const prompt = `Generate a 30-second motivational voiceover script for an Instagram and YouTube reel. The script should start with an attention-grabbing question or surprising fact, followed by a motivational message about overcoming procrastination. Include a practical productivity hack that viewers can apply immediately, and end with an inspiring call to action. The tone should be upbeat, energetic, and engaging, with no headings, labels, or formatting cues—just the plain text for the voiceover.`;
    
        try {
          // Use the gemini-pro model
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
          const result = await model.generateContent(prompt);
          const script = result.response.text().trim();
    
          console.log("Generated Script: ", script);
          resolve(script);
        } catch (error) {
          console.error("Error generating script: ", error);
          reject(error);
        }
    })
},

 generateVoiceOverFromScript : (script, filename = 'voiceover.wav') => {
    return new Promise((resolve, reject) => {
      console.log("Creating voice-over...");
      console.log("text =",script);
      // Check if script is provided and convert to string if necessary
    if (script == null) {
        return reject(new Error("Script is null or undefined"));
      }
  
      // Convert script to string if it's not already
      const scriptString = String(script);
  
      // Check if the script is empty after conversion
      if (scriptString.trim().length === 0) {
        return reject(new Error("Script is empty"));
      }
  
      const filepath = path.join(__dirname, filename);
      gtts.save(filepath, scriptString, (err) => {
        if (err) {
          console.error("Error saving voice-over:", err);
          reject(err);
        } else {
          console.log('Voice-over saved successfully');
          resolve(filepath);
        }
      });
    });
  },

  voiceover : ()=>
  {
    return new Promise (async(resolve,reject)=>
    {
        // Convert text to speech
        const request = {
            input: { text: 'Hello, welcome to our website!' },
            voice: { languageCode: 'en-GB', ssmlGender: 'MALE' },
            audioConfig: { audioEncoding: 'MP3' },
          };
        
         try {
    const response = await axios.post('http://localhost:5002/api/tts', {
      text: text,
      voice: 'en_us_male', // Example voice parameter
    });

    const audioContent = response.data.audioContent;

    // Save the audio content to a file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('output.wav', Buffer.from(audioContent, 'base64'));

    console.log('Audio content written to file: output.wav');
  } catch (error) {
    console.error('Error generating speech:', error.message);
  }
    })
  },
  // Create a client

 voiceoverNew : (prompt) => {
  return new Promise(async(resolve, reject) => {
    const API_TOKEN = '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';
    const MODEL_NAME = 'EleutherAI/gpt-neox-20b '; 
    // Text to be converted to speech
    // responsiveVoice.speak("hello world");
    try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
          { inputs: prompt },
          {
            headers: {
              Authorization: `Bearer ${API_TOKEN}`,
            },
          }
        );
    
        const generatedText = response.data[0]?.generated_text || "No output generated.";
        console.log(generatedText);
      } catch (error) {
        console.error('Error generating text:', error.response?.data || error.message);
      }
  });
},

tts : () => {
    return new Promise(async(resolve, reject) => {
        const textToSpeak = "Hello, welcome to our website!";
      const barkApiUrl = 'http://127.0.0.1:5000'; // Replace with your ngrok URL

      try {
        // Make a request to the Bark AI server
        const response = await axios.post(barkApiUrl, {
          text: textToSpeak
        }, { responseType: 'arraybuffer' });

        const audioContent = response.data;
        const filePath = path.join(__dirname, '../public/audio/output.wav'); // Save to a public directory
        fs.writeFileSync(filePath, Buffer.from(audioContent), 'binary');

        resolve({ audioUrl: '/audio/output.wav' });
      } catch (error) {
        console.error('Error:', error.message);
        reject(error);
      }
    })
},
testapi : () => {
    return new Promise(async(resolve, reject) => {
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'Say this is a test' }],
            model: 'gpt-3.5-turbo',
          });
          
          console.log(chatCompletion.choices[0].message.content);
    })
},
voiceOverPython :()=>
{
    return new Promise ((resolve ,reject)=>
    {
        const text = "hi hello , Did you know that 20% of people admit to procrastinating more than half of their work tasks? If you're one of them, don't worry! You can overcome procrastination by breaking down tasks into smaller chunks. Start with the *easiest* one today, and you'll be surprised how quickly you make progress. Remember, procrastination is just a habit, and like any habit, you can break it with consistency and determination. So, what are you waiting for? Embrace the power of action today!";
        const pythonScriptPath = path.join(__dirname, '../bark-ai/barkai.py');
        const outputFilePath = path.join(__dirname, '../voiceOver/voiceover.wav');


        // Execute the Python script
        exec(`python ${pythonScriptPath} "${text}"  "${outputFilePath}" `, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Stdout: ${stdout}`);
        });
    })
},
}