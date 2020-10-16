import axios from 'axios';

const discord = axios.create({
    baseURL: 'https://discord.com/api',
});

export default discord;
