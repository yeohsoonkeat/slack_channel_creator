const create = [
  {
    type: "divider"
  },
  {
    block_id: "prefix",
    type: "input",
    element: {
      type: "static_select",
      action_id: "prefix_option",
      placeholder: {
        type: "plain_text",
        text: "Select a prefix/name convention",
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
    type: "input",
    block_id: "channel_name",
    label: {
      type: "plain_text",
      text: "Channel Name"
    },
    element: {
      type: "plain_text_input",
      action_id: "name_input"
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Should we make the channel Private?*"
    },
    accessory: {
      type: "static_select",
      action_id: "private",
      placeholder: {
        type: "plain_text",
        text: ":hash: public",
        emoji: true
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: ":lock: private",
            emoji: true
          },
          value: "y"
        },
        {
          text: {
            type: "plain_text",
            text: ":hash: public",
            emoji: true
          },
          value: "n"
        }
      ]
    }
  },
  {
    type: "divider"
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
      value: "help"
    }
  },
  {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "For more info, contact <yeohsoonkeat18@kit.edu.kh>"
      }
    ]
  }
];
module.exports = create;
