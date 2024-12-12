const userRouter = require('express').Router();
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../utils/config');

const User = require('../models/user');

userRouter.post('/', async (request, response) => {
  const { email, password } = request.body;

  let user = await User.findOne({ email });
  logger.info(`User found ${user}`);
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!user) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      passwordHash
    });

    user = await newUser.save();
  } else if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    });
  }

  const userForToken = {
    email: user.email,
    id: user._id
  };

  const token = jwt.sign(userForToken, JWT_SECRET);

  response.status(200).send({ token, email: user.email });
});

module.exports = userRouter;
