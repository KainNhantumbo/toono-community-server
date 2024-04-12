declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production';
      PORT?: string;
      NODE_DEBUG?: string;
      ALLOWED_DOMAINS?: string;
      REFRESH_TOKEN?: string;
      ACCESS_TOKEN?: string;
      JWT_EXPDATE?: string;
      CLOUDINARY_NAME?: string;
      CLOUDINARY_API_KEY?: string;
      CLOUDINARY_API_SECRET?: string;
      DATABASE_URL?: string;
    }
  }
}

export {};
