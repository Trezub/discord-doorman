import { Router } from 'express';
import mongo from 'mongodb';
import discord from './controllers/discord';

const router = Router();

router.get('/discord/callback', discord.discordCallback);
export default router;
