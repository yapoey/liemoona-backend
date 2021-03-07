const express = require('express');
const { validationResult, body } = require("express-validator");
const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth')

const router = express.Router();

router.put('/signup', [
    body('email')
    .isEmail()
    .withMessage('Please enter valid email.')
    .custom((value, { req }) => {
        return User.findOne({ email: value })
            .then(userDoc => {
                if (userDoc) {
                    return Promise.reject('Email address alread exists.')
                }
            })
    })
    .normalizeEmail(),
    body('password').trim().isLength({ min: 5 }),
    body('name').trim().not().isEmpty(),
    body('userName').trim().isLength({ min: 5})
], authController.signup);

router.get('/check/:email/available', authController.checkEmail)

router.post('/login', authController.login)

router.delete('/remove', isAuth, authController.removeAccount);

module.exports = router;