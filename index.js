import express from 'express';
import dotenv from 'dotenv';
import errorHandler from './src/middleware/errorHandler.js';
import masterRoutes from './src/routes/master.routes.js';
import messageRoutes from './src/routes/messagesRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());


app.use('/messages', messageRoutes);
app.use('/masters', masterRoutes);
app.use(errorHandler);


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
