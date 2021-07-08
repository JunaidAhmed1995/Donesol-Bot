import express from "express";
import ChatbotController from "../controllers/ChatbotController";

let router = express.Router();

let initRoutes = (app) => {
  router.get("/", ChatbotController.homePage);
  router.get("/webhook", ChatbotController.getWebHook);
  router.post("/webhook", ChatbotController.postWebHook);
  router.get("/initial-setup", ChatbotController.handleInitialSetup);

  return app.use("/", router);
};

//exporting function
module.exports = initRoutes;
