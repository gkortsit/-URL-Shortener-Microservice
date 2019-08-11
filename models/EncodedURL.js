const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const encodedURLSchema = new Schema({
    original_url: { type: String, required: true },
    short_url: Number
});

const EncodedURL = mongoose.model('EncodedURL', encodedURLSchema);
module.exports = EncodedURL;
