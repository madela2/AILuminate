import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import setupSwagger from './swagger.js';
import app from './app.js';
import { config } from './config/env.js';

dotenv.config();

setupSwagger(app);

const PORT = config.PORT;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection failed', err.message);
    });