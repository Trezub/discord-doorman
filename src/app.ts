import Express from 'express';
import routes from './routes';

const app = Express();

app.use(routes);
app.use(Express.static('public'));
const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`App listening on port ${port}`));
