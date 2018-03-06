const dotenv = require("dotenv");
const steem = require("steem");
var Slack = require("slack-node");

dotenv.config();
slack = new Slack();

const monitoringTag = process.env.MONITORING_TAG;
const creator = process.env.CREATOR;
const postKey = process.env.POST_KEY;

const query = { tag: monitoringTag, limit: 10 };
steem.api.getDiscussionsByCreated(query, function(err, res) {
  if (err) {
    console.log(err);
  } else {
    res.forEach(post => {
      const voters = post.active_votes.map(vote => vote.voter);
      const isVoted = voters.includes(creator);
      if (!isVoted) {
        // 댓글 달기
        comment(post);
        // 보팅 하기
        voting(post);
        // 슬랙에 메시지 보내기
        sendMessage(post);
      }
    });
  }
});

function comment(post) {
  const title = "";
  const body = `안녕하세요. \`${monitoringTag}\`태그를 사용해주셔서 감사합니다.\n업보팅하고 갑니다.👋`;
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
      text: `meshkorea tagged post is submitted.\n*${post.title}* - by ${
        post.author
      }\nhttps://steemit.com${post.url}`
    },
    function(err, response) {
      console.log(response);
    }
  );
}
