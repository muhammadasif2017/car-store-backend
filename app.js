const config = require('./utils/config');
const express = require('express');
const app = express();
const cors = require('cors');
const carStoreRouter = require('./controllers/car-store');
const middlewear = require('./utils/middlewear');
const logger = require('./utils/logger');
const moongoose = require('mongoose');
const userRouter = require('./controllers/user');
const path = require('path');

moongoose.set('strictQuery', false);

logger.info(`connecting to ${config.MONGODB_URI}`);

moongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB: ', error.message);
  });

const fs = require('fs');

// Check if the 'uploads' directory exists, if not create it
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.static('dist'));
app.use(express.json());
app.use(middlewear.requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/login', userRouter);
app.use('/api/cars', carStoreRouter);

app.use(middlewear.unknownEndpoint);
app.use(middlewear.errorHandler);

module.exports = app;
