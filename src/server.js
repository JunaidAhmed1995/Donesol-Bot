require("dotenv").config();
import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/ViewEngine";
import initRoutes from "./routes/Routes";

let app = express();

//config view engine
viewEngine(app);

//config body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//init Routes
initRoutes(app);

let port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("App is running at port: " + port);
});
