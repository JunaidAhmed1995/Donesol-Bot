require("dotenv").config();
import request from "request";
import FacebookService from "../services/FacebookServices";

const MY_VERIFY_TOKEN = process.env.MY_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

//function for testing the port
let homePage = (req, res) => {
  return res.send("Hello Heroku, I am successfully deployed my Node.js App");
};

// Adds support for GET requests to our webhook
let getWebHook = (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = MY_VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

// Creates the endpoint for our webhook
let postWebHook = (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      //check the incoming message from Primary app or not?
      //if Secondary app, EXIT.
      if (entry.standby) {
        //if user's message is "back" or "exit"
        //return conversation to bot
        let webhook_standby = entry.standby[0];
        if (webhook_standby && webhook_standby.message) {
          if (
            webhook_standby.message.text === "back" ||
            webhook_standby.message.text === "exit"
          ) {
            //call the function to return conversation to Primary App (bot)
            // FacebookService.passThreadControl(
            //   webhook_standby.sender.id,
            //   "primary"
            // );
            FacebookService.takeThreadControl(webhook_standby.sender.id);
          }
        }

        return;
      }
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

// Handles messages events
let handleMessage = async (sender_psid, received_message) => {
  //check is the incoming message is from Quick Reply?
  if (
    received_message &&
    received_message.quick_reply &&
    received_message.quick_reply.payload
  ) {
    let payload = received_message.quick_reply.payload;

    //user tap on categories quick-reply
    if (payload === "CATEGORIES_PAYLOAD") {
      await FacebookService.showCategories(sender_psid);
      return;
    }
    //user tap on lookup_order quick-reply
    if (payload === "LOOKUP_ORDER_PAYLOAD") {
      await FacebookService.showLookupOrder(sender_psid);
      return;
    }
    //user tap on talk_to_an_agent quick-reply
    if (payload === "TALK_TO_AGENT_PAYLOAD") {
      await FacebookService.requestTalkToAgent(sender_psid);
      return;
    }
    //payload is a phone number!
    if (payload !== " ") {
      await FacebookService.doneAppointmentWithArchitect(sender_psid);
      return;
    }
    return;
  }

  //handle text message
  let entity = handleMessageWithEntities(received_message);

  if (entity === "datetime") {
    await FacebookService.askUserForPhoneNumber(sender_psid);
  } else if (entity === "phone_number") {
    //something here
    await FacebookService.doneAppointmentWithArchitect(sender_psid);
  } else {
    //default reply here
    let response = {
      text: "i am a default response",
    };
    await FacebookService.callSendAPI(sender_psid, response);
  }
};

//return entity name, value etc... as object
let handleMessageWithEntities = (message) => {
  console.log("===message===", message);
  const entitiesArray = ["datetime", "phone_number"];
  let entityChosen = "";
  // let data = {}; //data is an object saving name and value of the entity
  entitiesArray.forEach((name) => {
    let entity = firstEntity(message.nlp, name);
    if (entity && entity.confidence > 0.8) {
      entityChosen = name;
      // data.value = entity.value;
    }
  });
  // data.name = entityChosen;
  return entityChosen;
};

//return the entity in message
let firstEntity = (nlp, name) => {
  return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
};

// Handles messaging_postbacks events
let handlePostback = async (sender_psid, received_postback) => {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  switch (payload) {
    case "TALK_TO_AGENT_PAYLOAD":
      await FacebookService.requestTalkToAgent(sender_psid);
      break;
    case "SHOW_ANIMALS_PAYLOAD":
      await FacebookService.showAnimals(sender_psid);
      break;
    case "SHOW_NATURE_PAYLOAD":
      break;
    case "MAKE_APPOINTMENT_WITH_ARCHITECT_PAYLOAD":
      await FacebookService.makeAppointmentWithArchitect(sender_psid);
      break;
    case "GET_STARTED_PAYLOAD":
    case "RESTART_BOT_PAYLOAD":
      await FacebookService.welcomeNewUser(sender_psid);
      break;
    case "BACK_TO_CATEGORIES_PAYLOAD":
      await FacebookService.goBackToCategories(sender_psid);
      break;
    case "MAIN_MENU_PAYLOAD":
      await FacebookService.goBackToMainMenu(sender_psid);
      break;
    case "SET_ORDER_INFO_PAYLOAD":
      break;
    default:
      console.log("default block in handlePostback");
  }
};

// // Sends response messages to user via the Send API
// let callSendAPI = async (sender_psid, response) => {
//   //for marked message as seen
//   await FacebookService.markedMessageAsSeen(sender_psid);

//   //for show typing animation
//   await FacebookService.showTypingAnimation(sender_psid);

//   // Construct the message body
//   let request_body = {
//     recipient: {
//       id: sender_psid,
//     },
//     message: response,
//   };

//   // Send the HTTP request to the Messenger Platform
//   request(
//     {
//       uri: "https://graph.facebook.com/v7.0/me/messages",
//       qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
//       method: "POST",
//       json: request_body,
//     },
//     (err, res, body) => {
//       if (!err) {
//         console.log("message sent!");
//       } else {
//         console.error("Unable to send message:" + err);
//       }
//     }
//   );
// };

//call getInitialSetup() in FacebookServices.js
let handleInitialSetup = async (req, res) => {
  try {
    await FacebookService.getInitialSetup();
    return res.redirect("/");
  } catch (e) {
    console.log(e);
  }
}; //handleInitialSetup functions ENDs!

//info about lookup order
let getInfoLookupOrderPage = (req, res) => {
  let facebookAppId = process.env.FACEBOOK_APP_ID;
  return res.render("infoLookupOrder.ejs", { facebookAppId: facebookAppId });
};

//set info lookup order
let setInfoLookupOrder = async (req, res) => {
  try {
    let response1 = {
      text: `Order Details\n\nCustomer Name:\t ${req.body.customerName}\nEmail:\t\t\t ${req.body.email}\nOrder Number:\t ${req.body.orderNumber}`,
    };

    //sending a button template message
    let response2 = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "We are checking your Order Details. Be Patient! Once done will notify you. Thanks!",
          buttons: [
            {
              type: "postback",
              title: "Main Menu",
              payload: "MAIN_MENU_PAYLOAD",
            },
          ],
        },
      },
    };

    await FacebookService.callSendAPI(req.body.psid, response1);
    await FacebookService.callSendAPI(req.body.psid, response2);

    return res.status(200).json({
      message: "Successfully Set the Info Lookup Order",
    });
  } catch (e) {
    console.log("==error in setInfoLookupOrder==", e);
  }
};

//now exporting functions as a object [property: value]
module.exports = {
  homePage: homePage,
  getWebHook: getWebHook,
  postWebHook: postWebHook,
  handleInitialSetup: handleInitialSetup,
  getInfoLookupOrderPage: getInfoLookupOrderPage,
  setInfoLookupOrder: setInfoLookupOrder,
};

// let response;

// // Check if the message contains text
// if (received_message.text) {
//   // Create the payload for a basic text message
//   response = {
//     text: `You sent the message: "${received_message.text}". Now send me an image!`,
//   };
// } else if (received_message.attachments) {
//   // Gets the URL of the message attachment
//   let attachment_url = received_message.attachments[0].payload.url;
//   response = {
//     attachment: {
//       type: "template",
//       payload: {
//         template_type: "generic",
//         elements: [
//           {
//             title: "Is this the right picture?",
//             subtitle: "Tap a button to answer.",
//             image_url: attachment_url,
//             buttons: [
//               {
//                 type: "postback",
//                 title: "Yes!",
//                 payload: "YES_PAYLOAD",
//               },
//               {
//                 type: "postback",
//                 title: "No!",
//                 payload: "NO_PAYLOAD",
//               },
//             ],
//           },
//         ],
//       },
//     },
//   };
// }

// // Sends the response message
// await FacebookService.callSendAPI(sender_psid, response);

//another snippet

// switch (payload) {
//   case "CATEGORIES_PAYLOAD":
//     await FacebookService.showCategories(sender_psid);
//     break;
//   case "LOOKUP_ORDER_PAYLOAD":
//     await FacebookService.showLookupOrder(sender_psid);
//     break;
//   case "TALK_TO_AGENT_PAYLOAD":
//     await FacebookService.requestTalkToAgent(sender_psid);
//     break;
//   default:
//     console.log("default block in handleMessage in ChatbotController.js");
// }
