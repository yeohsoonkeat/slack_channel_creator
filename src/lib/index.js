const channel_name_validate = (channel_name, prefix) => {
  const reserved_prefix = /kit-|acad-/;
  const error = {};
  const has_no_prefix = /^no$/.test(prefix);
  const len = channel_name.length + (!has_no_prefix ? prefix.length : 0);
  if (len > 25) {
    error["channel_name"] = "Channel name must not exceed 25 characters";
  }
  if (reserved_prefix.test(channel_name) && has_no_prefix) {
    error["channel_name"] =
      "Unofficial channel name must not have reserved prefix. Check `help` for more info";
  }
  if (/[^a-z0-9\-\_]/g.test(channel_name)) {
    error["channel_name"] =
      "Slack channel name can only support character and numbers";
  }
  return error;
};

module.exports = {
  channel_name_validate
}