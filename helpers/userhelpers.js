require('dotenv').config();
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');



const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;


module.exports={

  fetchFromPexels: (query) => {
    return new Promise(async (resolve, reject) => {
      console.log("got helpers");
        const url = `https://api.pexels.com/v1/search?query=${query}&per_page=5`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            });
            resolve(response.data.photos);
        } catch (error) {
            reject(error);
        }
    });
},

 fetchFromPixabay: (query) => {
    return new Promise(async (resolve, reject) => {
        const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${query}&image_type=photo&per_page=5`;
        try {
            const response = await axios.get(url);
            resolve(response.data.hits);
        } catch (error) {
            reject(error);
        }
    });
},


fetchMedia: (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pexelsPhotos = await module.exports.fetchFromPexels(query);
            const pixabayPhotos = await module.exports.fetchFromPixabay(query);
            const photos = [
                ...pexelsPhotos.map(photo => ({ src: photo.src.original, source: 'Pexels' })),
                // ...unsplashPhotos.map(photo => ({ src: photo.urls.full, source: 'Unsplash' })),
                ...pixabayPhotos.map(photo => ({ src: photo.largeImageURL, source: 'Pixabay' }))
            ];
            // const srcs = photos.map(photo => photo.src); 
            // console.log('Fetched Photos:', photos.map(photo => photo.src));
            console.log(Array.isArray(photos)); // Should output true if images is an array

            resolve(photos.map(photo => photo.src));
        } catch (error) {
            console.error('Error fetching media:', error);
            reject(error);
        }
    });
},

 compileVideo : (images) => {
    return new Promise((resolve, reject) => {
        const outputVideoPath = path.join(__dirname, '../public/videos', 'output.mp4');
        // const command = ffmpeg();
       
        const images = [
            path.join(__dirname, '../public/images/image1.png'),
            path.join(__dirname, '../public/images/image.png'),
            // ... other image paths
        ];
        // const outputVideoPath = path.join(__dirname, '../public', 'output.mp4');
        // const command = ffmpeg();

        console.log('Images to compile:', images);

       
        // ffmpeg()
        // .input('./public/images/image%01d.png') // Use a pattern type for sequential images
        // .inputOptions('-framerate 1/2')
        // .duration(10)
        // .saveToFile(outputVideoPath)
        // .on('end', () => console.log('Video compilation successful!'))
        // .on('error', (error) => console.error('Error compiling video:', error));
        // const outputVideoPath = path.join(__dirname, '../public/videos', 'output.mp4');
        const imagePattern = path.join(__dirname, '../public/images/image%01d.png');

        console.log('Using image pattern:', imagePattern);

        ffmpeg()
            .input(imagePattern)
            .inputOptions(['-framerate 1/5']) // Display each image for 5 seconds
            .outputOptions([
                '-c:v libx264', // Video codec
                // '-r 30', // Frames per second
                // '-pix_fmt yuv420p' // Pixel format
            ])
            .on('start', (commandLine) => {
                console.log('Spawned FFmpeg with command: ' + commandLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' +  JSON.stringify(progress) + '% done');
            })
            .on('end', () => {
                console.log('Video compilation finished!');
                resolve();
            })
            .on('error', (err) => {
                console.error('Error during video compilation:', err);
                reject(err);
            })
            .save(outputVideoPath)

        
    });
},



}