import express from 'express';
import messagesRoutes from './src/routes/messagesRoutes.js';
import prospectRoutes from './src/routes/prospectRoutes.js';
import dotenv from 'dotenv';
// import errorHandler from './middleware/errorHandler.js'; // I'll uncomment if it exists
dotenv.config();

const app = express();
app.use(express.json());

app.use('/messages', messagesRoutes);
app.use('/prospects', prospectRoutes);
// app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
