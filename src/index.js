require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require("request");
// Creates express app
const app = express();
// The port used for Express server
const PORT = 3000;

const GITLAB_BASE_URL = process.env.GITLAB_HOST;
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const PROJECT_ID = process.env.GITLAB_PROJECT_ID;

const gitlabApiHeaders = {
  'Content-Type': 'application/json',
  'Private-Token': GITLAB_TOKEN
};

const daysBetween = (date1String, date2String) => {
  var d1 = new Date(date1String);
  var d2 = new Date(date2String);
  return parseInt((d1-d2)/(1000*3600*24));
};

const getReadyMergeRequests = () => {
  return new Promise ((resolve, reject) => {
    request({
      headers: gitlabApiHeaders,
      uri: `${GITLAB_BASE_URL}/api/v4/projects/${PROJECT_ID}/merge_requests?state=opened`,
      method: 'GET'
    }, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        const data = JSON.parse(res.toJSON().body);

        resolve(data.filter(mr => !mr.title.includes('WIP') && !mr.title.includes('wip')));
      }
    });
  });
};

const sendMergeRequestsToSlack = (mergeRequests) => {
  let message = `\n\n🐔 Coââââât, You have *${mergeRequests.length} pull requests* to review !\n\n`;
  mergeRequests.forEach(mr => {
    message += `\n- *${mr.title}* (${daysBetween(new Date().toISOString(), mr.created_at)} days old) : ${mr.web_url}\n`;
  });
  message += `\n\nIf one of this PR isn't ready yet, add WIP status cooâââââât 🐔.\n🥚🥚🥚`;
  var data = {form: {
    token: process.env.SLACK_AUTH_TOKEN,
    channel: "#pullrequests",
    "text": message
  }};
  request.post('https://slack.com/api/chat.postMessage', data, (error, response, body) => {
    // Sends welcome message
    console.log('OK');
  });
};




// Starts server
app.listen(PORT, function() {
  console.log('PouleRequest is listening on port ' + PORT);
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.send('Hello World!')
});
app.post('/', async (req, res) => {
  console.log('YOU POSTED TO ME ?');
  const mergeRequests = await getReadyMergeRequests();
  // console.log(mergeRequests);
  sendMergeRequestsToSlack(mergeRequests);
});

