# 🌟 Toono Community API (Node.JS + PostgreSQL)

This REST API server application is built to serve its endpoints to Toono Community platform ([see the source code here](https://github.com/KainNhantumbo/toono-community-app)), which is currently under active development.

## 🤩 Motivation

Find this [here](https://github.com/KainNhantumbo/toono-community-app/#Motivation) to avoid repeating myself.

## 🌠 Project status

This project is under active development, it means that new features a being backed at meanwhile and to catch all them please refer to the front-end app repository [here](https://github.com/KainNhantumbo/toono-community-app).

## 🐾 Project Stack

- **Express.JS** - a robust opinionated framework for building server applications with Node.js
- **Typescript** - a superset language of Javascript that provides typechecking.
- **Node.JS** - Javascript runtime.
- **Postgres** - database for storing data.
- **Cloudnary** - provides a cloud assets storage.
- **Zod** - for data validation.
- **Drizzle ORM** - an ORM for connecting application to PostgreSQL database.

## 🏗️ Testing and Local Setup

Make sure you have installed **Node.js (v18.17.0 or later recommended) which also comes with npm v9.6.7**.\

> **IMPORTANT**: - Make sure you add those environment variables below to your .env file:

```bash
# NODE ENVIRONMENT (DEVELOPMENT OR PRODUCTION)
NODE_ENV=

# DEBUG SYSTEM
NODE_DEBUG=

# SERVER PORT
PORT=

# ALLOWED DOMAINS FOR CORS (COMMA SEPARATED FOR MULTIPLE DOMAINS)
ALLOWED_DOMAINS=

# POSTGRESQL DATABASE URL
DATABASE_URL=

# TOKEN KEYS
REFRESH_TOKEN=
ACCESS_TOKEN=

#CLOUDINARY CONFIG
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# FOR GITHUB AUTHENTICATION (OPTIONAL)
GITHUB_SECRET_ID=
GITHUB_CLIENT_ID=
```

Then, in the project directory, you can run in terminal:

```bash
npm install
npm run dev
```

Runs the app in the development mode and the server will reload when you make changes to the source code.

```bash
npm run build
```

Builds the app for production to the **dist folder**.

```bash
npm run start
```

Builds and starts the server in production.

## ☘️ Find me!

E-mail: [nhantumbok@gmail.com](nhantumbok@gmail.com "Send an e-mail")\
Github: [https://github.com/KainNhantumbo](https://github.com/KainNhantumbo "See my github profile")\
Portfolio: [https://codenut-dev.vercel.app](https://codenut-dev.vercel.app "See my portfolio website")\
My Blog: [https://codenut-dev.vercel.app/blog](https://codenut-dev.vercel.app/blog "Visit my blog site")

#### If you like this project, let me know by leaving a star on this repository so I can keep improving this app.😊😘

Best regards, Kain Nhantumbo.\
✌️🇲🇿 **Made with ❤ Nest.JS and Typescript**

## 📜 License

Licensed under Apache License 2.0. All rights reserved.\
Copyright &copy; 2024 Kain Nhantumbo.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
