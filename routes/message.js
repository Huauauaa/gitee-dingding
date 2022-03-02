const express = require('express');
const router = express.Router();
const request = require('request');
const { roster, allLabel, dingURL } = require('../setting');

function transform(body) {
  let bodyString = JSON.stringify(body);
  roster.forEach((item) => {
    bodyString = bodyString.replaceAll(`@${item.gitee}`, `@${item.phone}`);
  });
  const bodyObject = JSON.parse(bodyString);
  bodyObject.at = {
    atMobiles: roster.map((item) => item.phone),
    isAtAll: allLabel.some((item) => bodyString.includes(item)),
  };
  return bodyObject;
}

router.post('/', (req, res) => {
  const body = transform(req.body);
  const options = {
    headers: { Connection: 'close' },
    url: dingURL,
    method: 'POST',
    json: true,
    body,
  };
  request(options, (error, response, data) => {
    if (!error && response.statusCode == 200) {
      res.json(data);
    }
  });
});

module.exports = router;
