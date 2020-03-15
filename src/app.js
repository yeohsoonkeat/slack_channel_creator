require("dotenv").config()
const { App } = require("@slack/bolt")

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: "/slack/events",
    commands: "/slack/commands",
    actions: "/slack/actions"
  }
});

app.command('/create_channel', async ({ context, payload, ack, respond }) => {
  ack();
  const { text, user_id, trigger_id } = payload
  const { botToken } = context
  if (text == "") {
    displayModel(botToken, trigger_id)
  } else {

    const flag = /--private/g
    const is_private = flag.test(text)
    let channel_name = text.replace(flag, "").trim()
    const validate = channel_name_validate(channel_name, "no")
    if (Object.values(validate).length == 0) {
      createChannel(channel_name, is_private, user_id)
        .then(res => respond("The channel was successfully created"))
        .catch(err => respond("The channel name is taken try something else."))
    } else {
      respond("Channel name must be under 25 characters and Unofficial channel cannot use reserved prefix.")
    }
  }
})

app.view('create_channel_view', ({ ack, body, payload }) => {
  const user_id = body.user.id
  const values = payload.state.values
  const channel_name = values['channel_name']['name_input'].value
  const prefix = values['prefix']['prefix_option']['selected_option'].value
  const validate = channel_name_validate(channel_name, prefix)
  if (Object.values(validate).length > 0) {
    ack({
      response_action: 'errors',
      errors: validate
    })
  } else {
    ack()
    const channel = /^no$/.test(prefix) ? channel_name : prefix + channel_name
    createChannel(channel, false, user_id)
      .then(_ => {
        app.client.views.update({
          token: context.botToken,
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
                  text: "The channel was successfully created.\nThank you for using our services. Goodbye :wave:",
                  emoji: true
                }
              }
            ]
          }
        })
      })
      .catch(err => {
        if (err.data.error == "name_taken") {
          app.client.views.push({
            token: context.botToken,
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
                    text: "The channel name is already taken please use other name. :smile:",
                    emoji: true
                  }
                }
              ]
            }
          })
        }
      })
  }
})

const channel_name_validate = (channel_name, prefix) => {
  const reserved_prefix = /kit-|acad-/
  const error = {}
  if (channel_name.length > 25) {
    error['channel_name'] = 'Channel name must not exceed 25 characters'
  }
  if (reserved_prefix.test(channel_name) && /^no$/.test(prefix)) {
    error['channel_name'] = 'Unofficial channel name must not have reserved prefix.'
  }
  return error
}

const createChannel = (channel_name, is_private, user_id) => {
  const token = process.env.SLACK_USER_TOKEN
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await app.client.conversations.create({
        token,
        name: channel_name,
        is_private
      })
      const invite = await app.client.conversations.invite({
        token,
        channel: channel.channel.id,
        users: user_id
      })
      const result = await app.client.conversations.leave({
        token,
        channel: invite.channel.id
      })
      resolve(result)
    }
    catch (error) {
      reject(error)
    }
  })
}

const displayModel = async (botToken, trigger_id) => {
  try {
    app.client.views.open({
      token: botToken,
      trigger_id: trigger_id,

      view: {
        type: 'modal',
        callback_id: 'create_channel_view',
        title: {
          type: 'plain_text',
          text: 'Channel Creator'
        },
        blocks: [
          {
            block_id: "prefix",
            type: "input",
            element: {
              type: "static_select",
              action_id: 'prefix_option',
              placeholder: {
                type: "plain_text",
                text: "Select an item",
                emoji: true
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "qa- *Description*: for question and answer channel",
                    emoji: true
                  },
                  value: "qa-"
                },
                {
                  text: {
                    type: "plain_text",
                    text: "None",
                    emoji: true
                  },
                  value: "no"
                }
              ]
            },
            label: {
              type: "plain_text",
              text: "Prefix of channel",
              emoji: true
            }
          },
          {
            type: 'input',
            block_id: 'channel_name',
            label: {
              type: 'plain_text',
              text: 'Channel Name'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'name_input',
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: 'Create',

        }
      }
    })
  }
  catch (error) {
    console.log(error);
  }
}

(async () => {
  await app.start(process.env.PORT || 3000)
  console.log("⚡️ Bolt app is running!")
})();