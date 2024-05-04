import "dotenv/config";
import Bootstrap from "./modules/core/app.module";
import CreateApp from "./modules/core/app.service";

const app = new CreateApp().getAppInstance();
const server = new Bootstrap({ app, port: Number(process.env.DB_URI) || 8080 });

server.start();
