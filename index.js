import express from 'express';
import routes from './router/messagesRoutes.js';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';
dotenv.config();

const app = express();
app.use(express.json());


app.use('/messages',routes);
app.use(errorHandler);


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
