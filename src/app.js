require("dotenv").config();
const { App } = require("@slack/bolt");
const help = require("./modals/help.js"  );
const create = require("./modals/create.js");
const { channel_name_validate } = require("./lib");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    commands: "/slack/commands",
    actions: "/slack/actions"
  }
});

const createChannel = (channel_name, is_private, user_id) => {
  const token = process.env.SLACK_USER_TOKEN;
  return new Promise(async (resolve, reject) => {
    is_private = is_private == true || is_private == "y";
    app.client.conversations
      .create({
        token,
        name: channel_name,
        is_private
      })
      .then(channel => {
        if (channel.ok && user_id != channel.channel.creator) {
          app.client.conversations
            .invite({
              token,
              channel: channel.channel.id,
              users: user_id
            })
            .then(async res => {
              console.log(res);
              if (res.ok) {
                app.client.conversations
                  .leave({
                    token,
                    channel: res.channel.id
                  })
                  .then(result => resolve(result))
                  .catch(err => reject(err));
              }
            })
            .catch(err => reject(err));
        } else {
          resolve(channel);
        }
      })
      .catch(err => reject(err));
  });
};

const displayModal = async (botToken, trigger_id, modal, submit = true) => {
  const option = {
    token: botToken,
    trigger_id: trigger_id,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Channel Creator"
      },
      blocks: [...modal]
    }
  };
  if (submit) {
    (option["view"]["callback_id"] = "create_channel_view"),
      (option["view"]["submit"] = {
        type: "plain_text",
        text: "Create"
      });
  }
  try {
    app.client.views.open(option).catch(err => console.log(err));
  } catch (error) {
    console.log(error);
  }
};

let is_private = false;

app.action("private", ({ ack, payload }) => {
  ack();
  is_private = payload["selected_option"].value;
});

app.action("help", ({ ack, body, context }) => {
  ack();
  if (!body.view) {
    displayModal(context.botToken, body.trigger_id, help, false)
    return
  }
  app.client.views.push({
    token: context.botToken,
    view_id: body.view.id,
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Channel Creator Help"
      },
      blocks: [...help]
    }
  });
});

app.command("/channel_creator", async ({ context, payload, ack, respond }) => {
  ack();
  const { text, user_id, trigger_id } = payload;
  const { botToken } = context;
  if (text.trim() == "") {
    displayModal(botToken, trigger_id, create);
  } else {
    if (/--help/gi.test(text)) {
      displayModal(botToken, trigger_id, help, false);
      return;
    }
    const flag = /--private/g;
    const is_private = flag.test(text);
    let channel_name = text.replace(flag, "").trim();
    const validate = channel_name_validate(channel_name, "no");
    if (Object.values(validate).length == 0) {
      createChannel(channel_name, is_private, user_id)
        .then(res => respond("The channel was successfully created"))
        .catch(err => {
          if (err.data.error == "name_taken")
            respond("The channel name is taken try something else.");
          else {
            console.log(err);
            respond("Some thing went wrong :sweat_smile:");
          }
        });
    } else {
      respond({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "Your *channel name* doesn't meet the following requirments :sweat_smile:: \n\t- Channel name must be under 25 characters\n \t- Only characters and numbers and two symbol -_\n\t- Unofficial channel cannot use _reserved prefix_"
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Please press the help button for `prefix` information"
            },
            accessory: {
              type: "button",
              action_id: "help",
              text: {
                type: "plain_text",
                text: "Help :male-detective:",
                emoji: true
              },
              value: "click_me_123"
            }
          }
        ]
      });
    }
  }
});

app.view("create_channel_view", ({ ack, body, payload, context }) => {
  const user_id = body.user.id;
  const values = payload.state.values;
  const channel_name = values["channel_name"]["name_input"].value;
  const prefix = values["prefix"]["prefix_option"]["selected_option"].value;
  const validate = channel_name_validate(channel_name, prefix);
  console.log(values);
  if (Object.values(validate).length > 0) {
    ack({
      response_action: "errors",
      errors: validate
    });
  } else {
    const channel = /^no$/.test(prefix) ? channel_name : prefix + channel_name;
    createChannel(channel, is_private, user_id)
      .then(_ => {
        ack({
          response_action: "update",
          view: {
            type: "modal",
            title: {
              type: "plain_text",
              text: "Successfully created"
            },
            blocks: [
              {
                type: "section",
                text: {
                  type: "plain_text",
                  text:
                    "The channel was successfully created.\nThank you for using our services. Goodbye :wave:",
                  emoji: true
                }
              }
            ]
          }
        });
      })
      .catch(err => {
        if (err.data.error == "name_taken") {
          ack({
            response_action: "push",
            view: {
              type: "modal",
              title: {
                type: "plain_text",
                text: "Name taken"
              },
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "plain_text",
                    text:
                      "The channel name is already taken please use other name. :smile:",
                    emoji: true
                  }
                }
              ]
            }
          });
        } else {
          console.log(err);
          ack({
            response_action: "push",
            view: {
              type: "modal",
              title: {
                type: "plain_text",
                text: "Unsuccessful"
              },
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "plain_text",
                    text: "Sorry, something happened",
                    emoji: true
                  }
                }
              ]
            }
          });
        }
      });
  }
});
app.error(err => console.log(err));
app.start(process.env.PORT || 3000).then(() => console.log("bolt running"));
app.receiver.app.get("/", (_, res) =>
  res.send("Hello, I'm channel creator bot.")
);
