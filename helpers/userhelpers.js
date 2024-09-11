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
const { exec ,spawn} = require('child_process');
const FormData = require('form-data');
const { Dropbox } = require('dropbox');





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
            console.log("vedio file path:", videosDir);
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
                `[0:v][1:v][2:v][3:v][4:v][5:v][6:v][7:v][8:v][9:v][10:v][11:v][12:v]concat=n=${videoFiles.length}:v=1:a=0[outv]`,
                `[outv]eq=brightness=-0.1:contrast=1.1[darkened]`,
                `[darkened]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[scaled]`,  // 9:16 aspect ratio
                `[scaled]subtitles='${subtitlesFilePath}':force_style='FontSize=24,Alignment=10,OutlineColour=&H00000000,BorderStyle=1,FontName=Arial,FontWeight=1000'[outv_with_subs]`,
                `[${videoFiles.length}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=1.5[a]`
            ];

            command
                .complexFilter(filterComplex.join(';'))
                .outputOptions([
                    '-map [outv_with_subs]',
                    '-map [a]',
                    '-c:v libx264',  // H264 codec
                    '-profile:v high',  // High profile for better quality
                    '-level 4.2',
                    '-preset slow',
                    '-crf 23',
                    '-c:a aac',
                    '-b:a 128k',
                    '-ar 48000',
                    '-movflags +faststart',
                    '-pix_fmt yuv420p',
                    '-r 30',
                    '-b:v 15M',  // Video bitrate (adjust as needed, max 25Mbps)
                    '-maxrate 20M',
                    '-bufsize 10M',
                    '-t 900',  // Limit duration to 15 minutes (900 seconds)
                    '-shortest',
                    '-max_muxing_queue_size 1024'
                ])// Map adjusted video and audio, and limit to the shortest stream
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


createInstaReelScript : (topic) => {
    return new Promise(async (resolve, reject) => {

        console.log("Entered prompt");
        const prompt = `Generate a 30-second motivational voiceover script for an Instagram and YouTube reel featuring luxury backgrounds. Start with an attention-grabbing statement or intriguing fact that evokes a sense of elegance or opulence. Follow with a motivational message that inspires viewers to pursue their highest potential or embrace a refined lifestyle. Include a practical tip or actionable advice that aligns with a luxurious and aspirational theme. End with an uplifting call to action that encourages viewers to elevate their lives. The tone should be sophisticated, aspirational, and engaging, with no headings, labels, or formatting cues—just the plain text for the voiceover`;
    
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

voiceOverPython :(text)=>
{
    return new Promise ((resolve ,reject)=>
    {
        // const text = "hi hello , Did you know that 20% of people admit to procrastinating more than half of their work tasks? If you're one of them, don't worry! You can overcome procrastination by breaking down tasks into smaller chunks. Start with the *easiest* one today, and you'll be surprised how quickly you make progress. Remember, procrastination is just a habit, and like any habit, you can break it with consistency and determination. So, what are you waiting for? Embrace the power of action today!";
        // const text="hello this is thannu";
        const pythonScriptPath = path.join(__dirname, '../bark-ai/barkai.py');
        const outputFilePath = path.join(__dirname, '../voiceOver/voiceover.wav');
        const outputAudioPathSpeed = path.join(__dirname, '../voiceOver/voiceoverSpeed.wav');
        const outputSrtFilePath = path.join(__dirname, '../voiceOver/subtitles.srt');
        const piperExe = path.join(__dirname, '../bark-ai/piper/piper.exe');
        const piperVoice=path.join(__dirname,'../bark-ai/piper/voices');




        // Execute the Python script
        // Use spawn instead of exec
        const pythonProcess = spawn('python', [pythonScriptPath, text, outputFilePath, outputSrtFilePath, outputAudioPathSpeed,piperExe,piperVoice]);

        // Listen for data on stdout
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Stdout: ${data}`);
        });

        // Listen for data on stderr
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Stderr: ${data}`);
        });

        // Listen for the close event to resolve or reject the promise
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log("python completed");
                
                resolve();
            } else {
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
    })
},
    uploadToInstagram :(videoUrl)=>
    {
        return new Promise (async(resolve ,reject)=>
            {   
                try {
                    // Define variables for the access token and media details
                    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
                    // const videoUrl = 'https://files.catbox.moe/y730vk.mp4';
                    const caption = 'hi hello';
                    const pageId = '17841468745414388'
                    console.log("creating id");
                    
              
                    // Step 1: Upload the video
                    const uploadResponse = await axios.post(
                      `https://graph.facebook.com/v20.0/${pageId}/media`,
                      new URLSearchParams({
                        media_type: 'REELS',
                        video_url: videoUrl,
                        caption: caption,
                        access_token: accessToken,
                      })
                    );
              
                    const creationId = uploadResponse.data.id; // Get the creation ID from the response
                    console.log('Upload successful, creation ID:', creationId);
                    
                    resolve(creationId);
                } catch (error) {
                    console.error('Error uploading the video:', error.response?.data || error.message);
                    reject( error);
                }
            
            })
    },
publishToInstagram:(creationId,vedioLink)=>
{
    return new Promise(async(resolve,reject)=>
    {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Helper function for delay
        const maxRetries = 5; // Maximum number of retry attempts
        let attempts = 0; // Track the number of attempts
        let reUploadAttempted = false; // Track if re-upload has been attempted


        const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        const pageId = '17841468745414388';

        while (attempts < maxRetries) {
            try {
                const publishResponse = await axios.post(
                `https://graph.facebook.com/v20.0/${pageId}/media_publish`,
                new URLSearchParams({
                    creation_id: creationId,
                    access_token: accessToken,
                })
                );
            
                console.log('Publish successful:', publishResponse.data);
                return resolve();
                } catch (error) {
                    const errorMsg = error.response?.data?.error.error_user_msg || error.message;
            
                    if (errorMsg === 'The media is not ready to be published. Please wait a moment.') {
                    attempts++;
                    console.log(`Attempt ${attempts} failed: ${errorMsg}. Retrying in 10 seconds...`);
                    await delay(10000); // Wait for 10 seconds before retrying
                    } else {
                    console.error('Error publishing the video:', error.response?.data || error.message);
                     return reject (error); // Throw other errors
                    }
                }
            }
            console.error('Max retry attempts reached. The media could not be published.');
            reject();
            // If all attempts fail, try to re-upload the video once
            if (!reUploadAttempted) {
                console.log('Max retry attempts reached. Trying to re-upload the media...');
                reUploadAttempted = true; // Set flag to indicate re-upload attempt
        
                try {
                const newCreationId = await module.exports.uploadToInstagram(vedioLink); // Call the re-upload function
                await module.exports.publishToInstagram(newCreationId); // Attempt to publish with the new creation ID
                resolve(); // Resolve if the second attempt is successful
                } catch (reUploadError) {
                console.error('Re-upload and publish failed:', reUploadError);
                reject(new Error('Re-upload and publish failed.')); // Reject if re-upload fails
                }
            } else {
                reject(new Error('Max retry attempts reached. The media could not be published.')); // Reject with a meaningful error message
            }
    })

},
 uploadToTransferSh : () => {
    return new Promise(async (resolve, reject) => {
     try{
        const filePath = path.join(__dirname, '../public/videos', 'output.mp4');
            const fileName = path.basename(filePath);
            console.log("filename=", fileName);

            // Create a FormData instance
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath), fileName);

            // Upload the file to file.io
            const response = await axios.post('https://file.io', form, {
                headers: {
                    ...form.getHeaders(),
                },
            });

            // Get the file URL from the response
            const fileUrl = response.data.link;
            const fileUrlWithExtension = fileUrl + '.mp4';

            console.log('File uploaded successfully:', fileUrlWithExtension);

            resolve(fileUrlWithExtension);
        } catch (error) {
            console.error('Error uploading file:', error.message);
            reject(error);
        }
    })
  },
}