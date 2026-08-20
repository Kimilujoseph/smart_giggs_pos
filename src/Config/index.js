import dotEnv from "dotenv";
dotEnv.config();
const config = {
  port: process.env.PORT,
  MONGO_URL: process.env.MONGO_URL,
  APP_SECRET: process.env.APP_SECRET,
  USER_SECRET: process.env.USER_SECRET,
  CLOUD_NAME: process.env.CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  MAILGUN_API_SECRET: process.env.MAILGUN_API_KEY,
  MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
};

export default config;
