const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        // required: true
        default: 'I am new'
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post' //leting mongooes know that related to post model
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);