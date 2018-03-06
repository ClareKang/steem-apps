const dotenv = require("dotenv");
const steem = require("steem");
var Slack = require("slack-node");
const { WebClient } = require("@slack/client");

dotenv.config();
slack = new Slack();

const monitoringTag = process.env.MONITORING_TAG;
const creator = process.env.CREATOR;
const token = process.env.SLACK_TOKEN;
const channelId = process.env.SLACK_CHANNEL;
const web = new WebClient(token);

const postKey = process.env.POST_KEY;

const query = { tag: monitoringTag, limit: 1 };
steem.api.getDiscussionsByCreated(query, function(err, res) {
  if (err) {
    console.log(err);
  } else {
    res.forEach(post => {
      const voters = post.active_votes
        .filter(vote => vote.percent > 0 && vote.weight > 0 && vote.rshares > 0)
        .map(vote => vote.voter);
      const isVoted = voters.includes(creator);
      if (!isVoted) {
        voting(post);
        comment(post);
        sendMessage(post);
      }
    });
  }
});

function comment(post) {
  const title = "";
  const body = `안녕하세요. \`${monitoringTag}\`태그를 사용하셨군요.\n업보팅하고 갑니다.👋`;
  const jsonMetadata = { tags: [monitoringTag] };
  steem.broadcast.comment(
    postKey,
    post.author,
    post.permlink,
    creator,
    steem.formatter.commentPermlink(post.author, post.permlink),
    title,
    body,
    jsonMetadata
  );
}

function voting(post) {
  steem.broadcast.vote(
    postKey,
    creator,
    post.author,
    post.permlink,
    100,
    (err, res) => {
      if (err) {
        console.log("error", err);
      } else {
        console.log("voted!", res);
      }
    }
  );
}

function sendMessage(post) {
  slack.setWebhook(process.env.SLACK_WEBHOOK);
  slack.webhook(
    {
      channel: "#steemit",
      username: "Steemit Bot",
      icon_emoji: "https://cdn.worldvectorlogo.com/logos/steemit-1.svg",
      text: `meshkorea tagged post is submitted.\n*${post.title}* - by ${
        post.author
      }\nhttps://steemit.com${post.url}`
    },
    function(err, response) {
      console.log(response);
    }
  );
}
