var linebot = require('linebot');
var express = require('express');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const app = express();
var bot = linebot({
  channelId: process.env.ChannelId,
  channelSecret: process.env.ChannelSecret,
  channelAccessToken: process.env.ChannelAccessToken,
});

const linebotParser = bot.parser();
var sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

var messageText = '';

bot.on('message', async event => {
  console.log(event);
  const {
    message: { type, text },
  } = event;

  messageText = text;

  if (type === 'text') {

    try {
      if (text.length < 31) {
        event.reply('請至 https://lihi1.cc/2yKBk 查看目前星星王的渾沌狀態！（桌機可 「ctrl + 方向鍵下」 到最底部）');

        fs.readFile('credentials.json', (err, content) => {
          if (err) return console.log('Error loading client secret file:', err);
          // Authorize a client with credentials, then call the Google Sheets API.
          authorize(JSON.parse(content), append);
        });
      } else {
        event.reply('請勿輸入超過 30 個字，資訊量超載惹！！')
      }
    } catch (error) {
      console.log(error)
    }

  } else {
    event.reply('請勿輸入文字以外的訊息，看不懂喇！！')
  }
});

app.get('/', (req, res) => {
    res.send('<h1>我是白熊財務長</h1>')
})
app.post('/', linebotParser);

var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});

const append = authClient => {
  if (authClient == null) {
    console.log('authentication failed');
    return;
  }

  const request = {
    spreadsheetId: process.env.LogSpreadSheetId,
    range: process.env.LogSheetRange,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [
        [`=(((${getTimeNow()}/60)/60)/24)+DATE(1970,1,1)`, messageText],
      ],
    },

    auth: authClient,
  };

  sheets.spreadsheets.values.append(request, (err, response) => {
    if (err) {
      console.error(err);
      return;
    }

    // TODO: Change code below to process the `response` object:
    console.log(JSON.stringify(response, null, 2));
  });
};

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  // console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

const getTimeNow = () => {
  const timestamp = Date.now();
  return Math.floor(timestamp / 1000) + 28800;
};