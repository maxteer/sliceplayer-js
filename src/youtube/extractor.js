const YT_PLAYER_CONFIG_REGEXS = [
  /;ytplayer\.config = (\{.*?\});ytplayer/,
  /;ytplayer\.config = (\{.*?\});/,
  /window\["ytInitialPlayerResponse"\] = (\{.*?\});/,
  /ytInitialPlayerResponse\s*=\s*(\{.+?\});/,
];
const YT_INITIAL_DATA_REGEXS = [
  /ytInitialData = (\{.*?\});/,
  /window\["ytInitialData"\] = (\{.*?\});/,
];

export default {
  extractYtPlayerConfig: function (html) {
    for (const regex of YT_PLAYER_CONFIG_REGEXS) {
      const matcher = html.match(regex);
      if (matcher) return matcher[1];
    }

    throw Error('YT_PLAYER_CONFIG not found.');
  },
  extractYtInitialData: function (html) {
    for (const regex of YT_INITIAL_DATA_REGEXS) {
      const matcher = html.match(regex);
      if (matcher) return matcher[1];
    }

    throw Error('YT_INITIAL_DATA not found.');
  },
};
