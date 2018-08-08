'use strict';
var express = require('express'),
request = require('request');

var router = express.Router();

router.route('/')
  .get(function(req, res) {
    request.post({
      url: 'https://api.twitter.com/oauth/request_token',
      oauth: {
        oauth_callback: "http%3A%2F%2Flocalhost%3A3000%2Ftwitter-callback",
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET_KEY
      }
    }, function (err, r, body) {
      if (err) {
        return res.send(500, { message: e.message });
      }

      try {
        var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
        res.send(JSON.parse(jsonStr));
      }
      catch(e) {
        if(JSON.parse(body).errors && JSON.parse(body).errors.length > 0) {
          res.send(JSON.parse(body));
        }
      }
    });
  });

  module.exports = router;