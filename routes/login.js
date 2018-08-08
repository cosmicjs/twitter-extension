'use strict';
var express = require('express'),
request = require('request');

var router = express.Router();

router.route('/')
  .get((req, res, next) => {
    request.post({
      url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
      oauth: {
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET_KEY,
        token: req.query.oauth_token
      },
      form: { oauth_verifier: req.query.oauth_verifier }
    }, function (err, r, body) {
      if (err) {
        return res.send(500, { message: err.message });
      }
      const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
      const parsedBody = JSON.parse(bodyString);
      if(parsedBody['oauth_token'] && parsedBody['oauth_token_secret']) {
        res.setHeader("x-auth-token", "twitter-token");
      }
      res.sendStatus(200);
    });
  });

module.exports = router;