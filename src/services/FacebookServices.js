require("dotenv").config();
import request from "request";

//setup the environment variables
const MY_VERIFY_TOKEN = process.env.MY_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

//function for get-started and persistant Menu
let getInitialSetup = () => {
  return new Promise((resolve, reject) => {
    try {
      let url = `https://graph.facebook.com/v11.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`;
      //construct the message body
      let request_body = {
        get_started: {
          payload: "GET_STARTED_PAYLOAD",
        },
        persistent_menu: [
          {
            locale: "default",
            composer_input_disabled: false,
            call_to_actions: [
              {
                type: "postback",
                title: "Talk to an Agent",
                payload: "TALK_TO_AGENT_PAYLOAD",
              },
              {
                type: "postback",
                title: "Restart the Conversation",
                payload: "RESTART_BOT_PAYLOAD",
              },
            ],
          },
        ],
        whitelisted_domains: ["https://donesol-bot.herokuapp.com/"],
      };

      // Send the HTTP request to the Messenger Platform
      request(
        {
          uri: url,
          method: "POST",
          json: request_body,
        },
        (err, response, body) => {
          if (!err) {
            resolve("setup successfully!");
          } else {
            reject(
              "Unable to setup get-started button and persistent menu:" + err
            );
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

//for getting facebook username
let getFacebookUsername = (sender_psid) => {
  return new Promise((resolve, reject) => {
    try {
      let url = `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`;
      // Send the HTTP request to the Messenger Platform
      request(
        {
          uri: url,
          method: "GET",
        },
        (err, response, body) => {
          if (!err) {
            //convert string [body] to json object here
            body = JSON.parse(body);
            let username = `${body.first_name} ${body.last_name}`;
            resolve(username);
          } else {
            reject("Unable to get username from FB Profile" + err);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

//show typing animation
let showTypingAnimation = (sender_psid) => {
  return new Promise((resolve, reject) => {
    try {
      //construct the message body
      let request_body = {
        recipient: {
          id: sender_psid,
        },
        sender_action: "typing_on",
      };

      let url = `https://graph.facebook.com/v11.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
      // Send the HTTP request to the Messenger Platform
      request(
        {
          uri: url,
          method: "POST",
          json: request_body,
        },
        (err, response, body) => {
          if (!err) {
            resolve("Animation is Showing!");
          } else {
            reject("Unable to show typing Animation" + err);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

//marked the message seen during chat
let markedMessageAsSeen = (sender_psid) => {
  return new Promise((resolve, reject) => {
    try {
      //construct the message body
      let request_body = {
        recipient: {
          id: sender_psid,
        },
        sender_action: "mark_seen",
      };

      let url = `https://graph.facebook.com/v11.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
      // Send the HTTP request to the Messenger Platform
      request(
        {
          uri: url,
          method: "POST",
          json: request_body,
        },
        (err, response, body) => {
          if (!err) {
            resolve("Message is marked as Seen!");
          } else {
            reject("Unable to marked message as seen" + err);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

// Sends response messages to user via the Send API
let callSendAPI = (sender_psid, response) => {
  return new Promise(async (resolve, reject) => {
    try {
      //for marked message as seen
      await markedMessageAsSeen(sender_psid);

      //for show typing animation
      await showTypingAnimation(sender_psid);

      // Construct the message body
      let request_body = {
        recipient: {
          id: sender_psid,
        },
        message: response,
      };

      // Send the HTTP request to the Messenger Platform
      request(
        {
          uri: "https://graph.facebook.com/v11.0/me/messages",
          qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
          method: "POST",
          json: request_body,
        },
        (err, res, body) => {
          if (!err) {
            resolve("message sent!");
          } else {
            reject("Unable to send message:" + err);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

//welcome new user who started with Get-Started button
let welcomeNewUser = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let username = await getFacebookUsername(sender_psid);

      //multiple responses against Get-Started Button
      let response1 = { text: `Hi, ${username}! Welcome to Donesol-bot` };
      let response2 = {
        attachment: {
          type: "image",
          payload: {
            url: "https://placeimg.com/100/100/tech",
          },
        },
      };
      let response3 = {
        text: "How May I Help You?",
        quick_replies: [
          {
            content_type: "text",
            title: "Categories",
            payload: "CATEGORIES_PAYLOAD",
          },
          {
            content_type: "text",
            title: "Lookup Order",
            payload: "LOOKUP_ORDER_PAYLOAD",
          },
          {
            content_type: "text",
            title: "Talk to an Agent",
            payload: "TALK_TO_AGENT_PAYLOAD",
          },
        ],
      };

      await callSendAPI(sender_psid, response1);
      await callSendAPI(sender_psid, response2);
      await callSendAPI(sender_psid, response3);
      resolve("All Responses are send to CallSendAPI");
    } catch (e) {
      reject(e);
    }
  });
};

//show categories
let showCategories = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      //sending a generic template message
      let response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              //first
              {
                title: "ANIMALS!",
                image_url: "https://placeimg.com/300/200/animals",
                subtitle: "A heart beats in animals the same as in us",
                default_action: {
                  type: "web_url",
                  url: "https://www.nationalgeographic.com/animals",
                  webview_height_ratio: "tall",
                },
                buttons: [
                  {
                    type: "web_url",
                    url: "https://www.nationalgeographic.com/animals",
                    title: "View Website",
                  },
                  {
                    type: "postback",
                    title: "Show Animals",
                    payload: "SHOW_ANIMALS_PAYLOAD",
                  },
                ],
              },
              //second
              {
                title: "NATURE!",
                image_url: "https://placeimg.com/300/200/nature",
                subtitle: "Join hands to save environment",
                default_action: {
                  type: "web_url",
                  url: "https://www.nature.com/",
                  webview_height_ratio: "tall",
                },
                buttons: [
                  {
                    type: "web_url",
                    url: "https://www.nature.com/",
                    title: "View Website",
                  },
                  {
                    type: "postback",
                    title: "Show Nature",
                    payload: "SHOW_NATURE_PAYLOAD",
                  },
                ],
              },
              //third
              {
                title: "ARCHITECTURE!",
                image_url: "https://placeimg.com/300/200/arch",
                subtitle: "Let the building speak",
                default_action: {
                  type: "web_url",
                  url: "https://www.archdaily.com/tag/architecture",
                  webview_height_ratio: "tall",
                },
                buttons: [
                  {
                    type: "web_url",
                    url: "https://www.archdaily.com/tag/architecture",
                    title: "View Website",
                  },
                  {
                    type: "postback",
                    title: "Show Architecture",
                    payload: "SHOW_ARCHITECTURE_PAYLOAD",
                  },
                ],
              },
            ],
          },
        },
      };
      await callSendAPI(sender_psid, response);
      resolve("Send categories as Carousel");
    } catch (e) {
      reject(e);
    }
  });
};

//show lookup order
let showLookupOrder = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      //sending a button template message
      let response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "OK! Lets set info about your order, so I won't need to ask them in the future",
            buttons: [
              {
                type: "web_url",
                url: `${process.env.URL_WEB_VIEW_ORDER}`,
                title: "Set Info!",
                webview_height_ratio: "tall",
                messenger_extensions: true, //false: open web-view in new tab
              },
              {
                type: "postback",
                title: "Main Menu",
                payload: "MAIN_MENU_PAYLOAD",
              },
            ],
          },
        },
      };
      await callSendAPI(sender_psid, response);
      resolve("Send categories as Carousel");
    } catch (e) {
      reject(e);
    }
  });
};

//to talk to agent
let requestTalkToAgent = (sender_psid) => {
  return new Promise((resolve, reject) => {
    try {
    } catch (e) {
      reject(e);
    }
  });
};

//showing different animals when user click on show Animals button in Categories Carousel
let showAnimals = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      //sending a generic template message
      let response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              //first
              {
                title: "COW",
                image_url: "https://placeimg.com/300/200/animals/sepia",
                subtitle: "$99999",
                default_action: {
                  type: "web_url",
                  url: "https://www.dairydealer.com/collections/dairy-cattle",
                  webview_height_ratio: "tall",
                },
                buttons: [
                  {
                    type: "web_url",
                    url: "https://www.dairydealer.com/collections/dairy-cattle",
                    title: "Order Now",
                  },
                  {
                    type: "postback",
                    title: "Back to Categories",
                    payload: "BACK_TO_CATEGORIES_PAYLOAD",
                  },
                  {
                    type: "postback",
                    title: "Main Menu",
                    payload: "MAIN_MENU_PAYLOAD",
                  },
                ],
              },
              //second
              {
                title: "GOAT",
                image_url: "https://placeimg.com/300/200/nature/sepia",
                subtitle: "$999",
                default_action: {
                  type: "web_url",
                  url: "https://blueskyorganicfarms.com/goats-for-sale/",
                  webview_height_ratio: "tall",
                },
                buttons: [
                  {
                    type: "web_url",
                    url: "https://blueskyorganicfarms.com/goats-for-sale/",
                    title: "Order Now",
                  },
                  {
                    type: "postback",
                    title: "Back to Categories",
                    payload: "BACK_TO_CATEGORIES_PAYLOAD",
                  },
                  {
                    type: "postback",
                    title: "Main Menu",
                    payload: "MAIN_MENU_PAYLOAD",
                  },
                ],
              },
            ],
          },
        },
      };
      await callSendAPI(sender_psid, response);
      resolve("Show Animals as Carousel");
    } catch (e) {
      reject(e);
    }
  });
};

//get back to categories Carousel
let goBackToCategories = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      await showCategories(sender_psid);
      resolve("back to categories carousel");
    } catch (e) {
      reject(e);
    }
  });
};

//set order info through web-view
let setOrderInfoByWebView = (sender_psid) => {};

//back to main menu
let goBackToMainMenu = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = {
        text: "How May I Help You?",
        quick_replies: [
          {
            content_type: "text",
            title: "Categories",
            payload: "CATEGORIES_PAYLOAD",
          },
          {
            content_type: "text",
            title: "Lookup Order",
            payload: "LOOKUP_ORDER_PAYLOAD",
          },
          {
            content_type: "text",
            title: "Talk to an Agent",
            payload: "TALK_TO_AGENT_PAYLOAD",
          },
        ],
      };
      await callSendAPI(sender_psid, response);
      resolve("go back to main menu");
    } catch (e) {
      reject(e);
    }
  });
};

//now exporting functions as a object [property: value]
module.exports = {
  getInitialSetup: getInitialSetup,
  getFacebookUsername: getFacebookUsername,
  showTypingAnimation: showTypingAnimation,
  markedMessageAsSeen: markedMessageAsSeen,
  callSendAPI: callSendAPI,
  welcomeNewUser: welcomeNewUser,
  showCategories: showCategories,
  showLookupOrder: showLookupOrder,
  requestTalkToAgent: requestTalkToAgent,
  showAnimals: showAnimals,
  goBackToCategories: goBackToCategories,
  setOrderInfoByWebView: setOrderInfoByWebView,
  goBackToMainMenu: goBackToMainMenu,
};
