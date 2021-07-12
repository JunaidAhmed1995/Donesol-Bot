import express from "express";
import ChatbotController from "../controllers/ChatbotController";

let router = express.Router();

//defines all routes here
let initRoutes = (app) => {
  router.get("/", ChatbotController.homePage);
  router.get("/webhook", ChatbotController.getWebHook);
  router.post("/webhook", ChatbotController.postWebHook);
  router.get("/initial-setup", ChatbotController.handleInitialSetup);
  router.get("/info-lookup-order", ChatbotController.getInfoLookupOrderPage);
  router.post("/set-info-lookup-order", ChatbotController.setInfoLookupOrder);

  return app.use("/", router);
};

//exporting function
module.exports = initRoutes;
