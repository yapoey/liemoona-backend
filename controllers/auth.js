const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Validation failed.");
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const userName = req.body.userName;
    bcrypt
        .hash(password, 12)
        .then((hashedPw) => {
            const user = User({
                email: email,
                password: hashedPw,
                name: name,
                userName: userName
            });
            return user.save();
        })
        .then((result) => {
            res.status(201).json({ message: "User created", userId: result._id, userName: result.userName });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                const error = new Error("A user could not be found.");
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then((isEqual) => {
            if (!isEqual) {
                const error = new Error("wrong password.");
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
            }, 'yapoeySecret', { expiresIn: '1h' });
            res.status(200).json({ token: token, userId: loadedUser._id.toString(), userName: loadedUser.userName })
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.checkEmail = (req, res, next) => {
    const email = req.params.email
    User.findOne({email: email})
    .then(user => {
        const available = user? true : false
        res.status(200).json({
            email: available
        })
    })
}

exports.removeAccount = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('cannot find user.');
                error.statusCode = 404;
                throw error;
            }
            return Post.deleteMany({ _id: { $in: user.posts } })
        })
        .then(result => {
            return User.findByIdAndRemove(req.userId);
        })
        .then(() => {
            res.status(200).json({
                message: 'User has been deleted'
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};