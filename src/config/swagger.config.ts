import swaggerAutoGenerator from "swagger-autogen";

export const docsGenerator = swaggerAutoGenerator({ openapi: "3.0.0" });

export const docsSchema = {
  openapi: "3.0.0",
  info: {
    title: "ToonoAPI",
    description: "Toono Community Server API with PostgreSQL DB",
    version: "1.0.0",
    contact: {
      name: "Kain Nhantumbo",
      url: "codenut-dev.vercel.app",
      email: "nhantumbok@gmail.com"
    },
    license: {
      name: "Apache License Version 2.0",
      url: "http://www.apache.org/licenses"
    }
  },
  servers: [{ url: "http://localhost:8080", description: "Development server" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        in: "header"
      }
    }
  }
};
