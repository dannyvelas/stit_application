import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
require('dotenv').config();

const dbURI = String(process.env.MONGO_URI);

// connect db
(async () => {
    try {
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });

        console.log('Connected DB');
    } catch(err) {
        console.error(err.message);
        process.exit(1);
    }
})();
