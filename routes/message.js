const express = require('express');
const router = express.Router();
const request = require('request');
const { roster, allLabel, dingURL, accessToken } = require('../setting');

function transform(body) {
  const result = {
    msgtype: 'markdown',
    password: '',
    sign: '',
    access_token: accessToken,
  };

  const {
    timestamp,
    hook_id,
    hook_name,
    hook_url,
    issue,
    comment,
    commits,
    repository,
    pull_request,
    sender,
    action,
  } = body;
  result.timestamp = timestamp;
  result.hook_id = hook_id;
  result.hook_name = hook_name;
  result.hook_url = hook_url;
  let what;
  switch (hook_name) {
    case 'push_hooks':
      what = commits
        .map(
          (item) =>
            `[${item.committer.name}: ${item.message}](${item.url}) [${repository.full_name}](${repository.html_url})`,
        )
        .join('\n');
      break;
    case 'issue_hooks':
      what = `[${issue.number} ${issue.title}](${issue.html_url}) \n ${
        issue.body || ''
      }`;
      break;
    case 'merge_request_hooks':
      what = `[${pull_request.title}](${pull_request.html_url}) assignee @${pull_request.assignee.username} \n ${pull_request.body}
      `;
      break;
    case 'note_hooks':
      what = `[${comment.body}](${comment.html_url}) on [${issue.number} ${issue.title}](${issue.html_url})`;
      break;
    default:
      throw 'known hook';
  }
  let transformedWhat = what;
  roster.forEach((item) => {
    const reg = new RegExp(`@${item.gitee}`, 'g');
    transformedWhat = transformedWhat.replace(reg, `@${item.phone}`);
  });
  result.at = {
    atMobiles: roster.map((item) => item.phone),
    isAtAll: allLabel.some((item) => what.includes(item)),
  };
  result.markdown = {
    text: `[${sender.name}](${sender.url}): ${action} ${transformedWhat} `,
    title: `${hook_name}`,
  };
  return result;
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
