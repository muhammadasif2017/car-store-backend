const carStoreRouter = require('express').Router();
const logger = require('../utils/logger');
const { JWT_SECRET } = require('../utils/config');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');

const CarStore = require('../models/car-store');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp for file name
  }
});

// Initialize multer with file size limit and file types
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB per file
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

carStoreRouter.get('/', (request, response) => {
  CarStore.find({}).then((cars) => {
    console.log('cars:', cars);
    response.json(cars);
  });
});

carStoreRouter.get('/info', (request, response) => {
  CarStore.find({}).then((cars) => {
    const responseStr = `<div>
      <p>Car Store has info for ${cars.length} cars</p>
      <p>${new Date()}</p>
    </div>`;
    response.send(responseStr);
  });
});

carStoreRouter.get('/:id', (request, response, next) => {
  const id = request.params.id;
  CarStore.findById(id)
    .then((car) => {
      if (car) {
        response.json(car);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

carStoreRouter.delete('/:id', (request, response, next) => {
  const id = request.params.id;

  CarStore.findByIdAndDelete(id)
    .then((car) => {
      if (car) {
        response.status(204).end();
      } else {
        response.status(404).send('Car not found');
      }
    })
    .catch((error) => next(error));
});
carStoreRouter.post(
  '/',
  upload.array('images', 10),
  (request, response, next) => {
    // console.log('request', request);
    console.log('request.files', request.files);
    const body = request.body;
    //   if (!body.name || !body.number) {
    //     return response.status(400).json({
    //       error: 'name or number is missing',
    //     });
    //   }
    const { token, carModel, price, phone, city } = body;
    const imageFiles = request.files;

    if (!token) return response.status(401).json({ message: 'Unauthorized' });

    const imageUrls = imageFiles.map((file) => `/uploads/${file.filename}`);

    console.log('toke', token);

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('decoded', decoded);
    const userId = decoded.id;
    console.log('userId', userId);

    const car = {
      userId,
      carModel,
      price,
      phone,
      city,
      images: imageUrls
    };
    const carbook = new CarStore(car);
    carbook
      .save()
      .then((car) => {
        logger.info(`added ${car.carModel} number ${car.price} to car store`);
        response.json(car);
      })
      .catch((error) => next(error));
  }
);

// carStoreRouter.put('/:id', (request, response, next) => {
//   const body = request.body;

//   const car = {
//     name: body.name,
//     number: body.number
//   };

//   CarStore.findByIdAndUpdate(request.params.id, car, {
//     new: true,
//     runValidators: true,
//     context: 'query'
//   })
//     .then((updatedCar) => {
//       response.json(updatedCar);
//     })
//     .catch((error) => next(error));
// });

module.exports = carStoreRouter;
