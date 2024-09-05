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
shuffleArrayVedios : (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
},

compile: () => {
    return new Promise(async (resolve, reject) => {
        try {
            const videosDir = path.join(__dirname, '../public/images'); // Directory containing video files
            const outputVideoPath = path.join(__dirname, '../public/videos', 'output.mp4'); // Output video path
            const audioFilePath = path.join(__dirname, '../voiceOver', 'voiceover.wav'); // Path to the audio file
            // const subtitlesFilePath = path.join(__dirname, '../voiceOver', 'subtitles.srt'); // Path to the subtitles file (using .srt format)
            const subtitlesFilePath = 'D\\:/programming/ai/voiceOver/subtitles.srt' // Path to the subtitles file (using .srt format)


            console.log("Audio file path:", audioFilePath);
            console.log("Subtitles file path:", subtitlesFilePath);

            // Get the list of video files
            let videoFiles = fs.readdirSync(videosDir).filter(file => file.match(/^vid\d+\.mp4$/));

            // Shuffle video files
            videoFiles = module.exports.shuffleArrayVedios(videoFiles);

            // Create a new FFmpeg command
            const command = ffmpeg();

            // Add video inputs
            videoFiles.forEach(video => {
                command.input(path.join(videosDir, video));
            });

            // Add audio input separately
            command.input(audioFilePath);

            // Create the filter_complex command
            const filterComplex = [
                `[0:v][1:v][2:v][3:v][4:v][5:v][6:v][7:v][8:v][9:v][10:v][11:v][12:v]concat=n=${videoFiles.length}:v=1:a=0[outv]`, // Concatenate video files
                `[outv]subtitles='${subtitlesFilePath}'[outv_with_subs]`, // Apply subtitles using subtitles filter
                `[${videoFiles.length}:a]atempo=1.25[a]` // Adjust the audio speed; `1.25` means 1.25x speed
            ];

            // Adjust the map options to correctly handle the video and modified audio
            command
                .complexFilter(filterComplex.join(';'))
                .outputOptions(['-map [outv_with_subs]', '-map [a]', '-shortest']) // Map adjusted video and audio, and limit to the shortest stream
                .output(outputVideoPath)
                .on('start', (commandLine) => {
                    console.log('Spawned FFmpeg with command: ' + commandLine);
                })
                .on('progress', (progress) => {
                    console.log('Processing: ' + JSON.stringify(progress) + '% done');
                })
                .on('end', () => {
                    console.log('Video compilation finished!');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error during video compilation:', err);
                    reject(err);
                })
                .run();

        } catch (err) {
            console.error('Error during processing:', err);
            reject(err);
        }
    });
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
        const outputSrtFilePath = path.join(__dirname, '../voiceOver/subtitles.srt');



        // Execute the Python script
        exec(`python ${pythonScriptPath} "${text}"  "${outputFilePath}" "${outputSrtFilePath}" `, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            reject();
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            reject();
        }
        console.log(`Stdout: ${stdout}`);
        resolve()
        });
    })
},



srt :()=>
    {
        return new Promise ((resolve ,reject)=>
        {
            const audioFilePath = path.join(__dirname, '../voiceOver', 'voiceover.wav'); // Path to the audio file
            const outputVideoPath = path.join(__dirname, '../public/videos', 'output.srt'); // Output video path
            const subtitlesFilePath = 'D\\:/programming/ai/voiceOver/subtitles.srt' // Path to the subtitles file (using .srt format)


            ffmpeg(audioFilePath)
            .addOption('-vn') // Exclude video
            .addOption('-acodec', 'copy') // Copy audio codec
            .addOption('-ss', '00:00:00') // Start time
            .addOption('-to', '00:00:30') // End time (30 seconds)
            .addOption('-f', 'srt') // Output format
            .save(subtitlesFilePath)
            .on('end', () => {
                console.log('Subtitles extracted successfully!');
            })
            .on('error', (err) => {
                console.error(err);
            });
        })
    },
}