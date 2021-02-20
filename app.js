const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./router/feed');
const router = require('./router/feed');


const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    let fileName = file.mimetype;
    if (fileName === 'image/png' || fileName === 'image/jpg' || fileName === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.json()); //application/json
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')); // image will the feild in the request
app.use('/images', express.static(path.join(__dirname, 'images'))) //serve images static path
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).join({ message: message })
});

mongoose.connect('mongodb+srv://yapoey:Eio4kjkThTdIoCsS@cluster0.92pax.mongodb.net/blog?retryWrites=true&w=majority')
    .then(result => {
        app.listen(8014);
    })
    .catch(err => {
        console.log(err)
    })