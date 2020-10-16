import axios from 'axios';

const steam = axios.create({
    baseURL: 'http://api.steampowered.com',
    params: {
        key: process.env.STEAM_API_KEY,
    },
});
