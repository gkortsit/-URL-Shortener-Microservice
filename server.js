'use strict';
require('dotenv').config();
const dns = require('dns');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const EncodedURL = require('./models/EncodedURL');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(process.cwd() + '/public'));

// Setup MongoDB
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });

// API endpoints...
app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', function(req, res) {
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    const originalURL = req.body.url;

    if (!urlRegex.test(originalURL)) {
        return res.send({ error: 'invalid URL' });
    }

    // parse URL to check if hostname is legit
    const typedURL = new URL(originalURL);
    // perform DNS lookup
    dns.lookup(typedURL.hostname, (err) => {
        if (err) {
            console.log(err);
            return res.send({ error: 'invalid URL' });
        }

        // check if link already exists
        EncodedURL.findOne({ original_url: originalURL }, (err, data) => {
            if (err) {
                return console.log(err);
            }

            if (data) {
                return res.send({
                    original_url: data.original_url,
                    short_url: data.short_url
                });
            }

            // if it doesnt exist
            // create links
            const shortURL = Math.floor(Math.random() * 1000);
            const links = new EncodedURL({
                original_url: originalURL,
                short_url: shortURL
            });

            // save links to database
            links.save((err, data) => {
                if (err) {
                    return console.log(err);
                }

                app.get(`/api/shorturl/${data.short_url}`, (req, res) => {
                    res.redirect(data.original_url);
                });

                return res.send({
                    original_url: data.original_url,
                    short_url: data.short_url
                });
            });
        });
    });
});

EncodedURL.find((err, docs) => {
    if (err) {
        return console.log(err);
    }

    for (let i = 0; i < docs.length; i++) {
        app.get(`/api/shorturl/${docs[i].short_url}`, (req, res) => {
            res.redirect(docs[i].original_url);
        });
    }
});

// start server
app.listen(port, function() {
    console.log('Node.js listening at port 3000...');
});
