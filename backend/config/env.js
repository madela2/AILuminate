import dotenv from 'dotenv';

dotenv.config();

export const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT || 5000
};