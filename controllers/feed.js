const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator/check");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 10;
    let totalItems;
    Post.find()
        .countDocuments()
        .then((count) => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage) //skip the amount of current pages
                .limit(perPage) //amount I want per page
        })
        .then((posts) => {
            res.status(200).json({
                message: "fetch posts",
                posts: posts,
                totalItems: totalItems //to show next btn in frontend
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Validation failed.");
        error.statusCode = 442;
        throw error;
    }
    if (!req.file) {
        const error = new Error("No image provided");
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    post
        .save()
        .then((result) => {
            console.log(result);
            return User.findById(req.userId)
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: "Post Created Successfully",
                post: post,
                creator: { _id: creator._id, name: creator.name }
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("could not find post");
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: "Post fetched",
                post: post,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error("no image picked");
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Validation failed.");
        error.statusCode = 442;
        throw error;
    }
    console.log(postId)
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("could not find post");
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                error = new Error('Not Authrized');
                error.statusCode = 403;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
        
            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            return post.save().then((result) => {
                res.status(200).json({ message: "Updated", post: result });
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("could not find post");
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                error = new Error('Not Authrized');
                error.statusCode = 403;
                throw error;
            }
            //chcek logged users
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(() => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            res.status(200).json({ message: "deleted" });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.addComment = (req, res, next) => {
    const postId = req.params.postId;
    const commentText = req.body.commentText;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Validation failed.");
        error.statusCode = 442;
        throw error;
    }

    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("could not find post");
                error.statusCode = 404;
                throw error;
            }
            post.comments.push({ user: req.userId, text: commentText });
            return post.save();
        })
        .then(result => {
            console.log(result);
            res.status(200).json({
                message: 'Comment added'
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

const clearImage = (filePath) => {
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, (err) => console.log(err));
};