require('dotenv').config();
const axios = require('axios');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;


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

fetchMedia: (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pexelsPhotos = await module.exports.fetchFromPexels(query);
            const photos = pexelsPhotos.map(photo => ({
                src: photo.src.original,
                source: 'Pexels'
            }));
            console.log('Fetched Photos:', photos);
            resolve(photos);
        } catch (error) {
            console.error('Error fetching media:', error);
            reject(error);
        }
    });
}

}