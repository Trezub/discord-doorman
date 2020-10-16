import { Request, Response } from 'express';
import { AuthorizationCode } from 'simple-oauth2';
import mongo from 'mongodb';
import discord from '../services/discord';

const config = {
    client: {
        id: process.env.DISCORD_CLIENT_ID,
        secret: process.env.DISCORD_SECRET,
    },
    auth: {
        tokenHost: 'https://discord.com',
        tokenPath: 'api/oauth2/token',
        revokePath: 'api/oauth2/token/revoke',
        authorizePath: 'api/oauth2/authorize',
    },
};
const discordAuth = new AuthorizationCode(config);

export type UserConnection = {
    type: string;
    id: string;
    name: string;
    visibility: number;
    friend_sync: boolean;
    show_activity: boolean;
    verified: boolean;
};

async function getConnections(token: string): Promise<UserConnection[]> {
    const response = await discord.get('/users/@me/connections', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
}

export default {
    async discordCallback(req: Request, res: Response) {
        const { code } = req.query;
        if (typeof code !== 'string') {
            return res.status(400).send();
        }
        try {
            const token = await discordAuth.getToken({
                code,
                redirect_uri: `${process.env.ROOT_URI}${req.path}`,
            });
            const [
                { data: me },
                mongoClient,
                userConnections,
            ] = await Promise.all([
                discord.get('/users/@me', {
                    headers: {
                        Authorization: `Bearer ${token.token.access_token}`,
                    },
                }),
                mongo.connect(process.env.MONGO_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                }),
                getConnections(token.token.access_token),
            ]);
            const db = mongoClient.db('dsdm');
            await db.collection('oauth-tokens').insertOne({
                discordId: me.id,
                token: token.token,
            });
            await db.collection('connections').insertMany(
                userConnections.map((c) => {
                    return {
                        ...c,
                        userId: me.id,
                    };
                }),
            );
            return res.redirect('/authsuccess');
        } catch (err) {
            console.error(err);
            return res.redirect('/authfailed');
        }
    },
};
