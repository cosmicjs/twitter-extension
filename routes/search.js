'use strict';
var express = require('express'),
request = require('request');

var router = express.Router();

router.route('/')
    .get((req, res, next) => {
      request.get({
        url: `https://api.twitter.com/1.1/search/tweets.json`,
        oauth: {
          consumer_key: process.env.TWITTER_API_KEY,
          consumer_secret: process.env.TWITTER_API_SECRET_KEY
          // token: oauth_token
        },
        qs:{
          q:req.query.q
        },
        json: true 
      }, function (err, r, body) {
          if (err) {
            return res.send(500, { message: err.message });
          }
          var authorId = [];
          var tweetId = [];
          body.statuses.forEach(function(el){
            authorId.push(el.user.id_str);
            tweetId.push(el.id_str);
          })
          req.authors = authorId;
          req.tweets = tweetId;
          next();
      });
    }, (req, res, next) => {
      var tweetsHtml = [];
      req.authors.forEach(function(el, idx){
        request.get({
          url: `https://publish.twitter.com/oembed?url=https%3A%2F%2Ftwitter.com%2F${el}%2Fstatus%2F${(req.tweets)[idx]}`,
          oauth: {
            consumer_key: process.env.TWITTER_API_KEY,
            consumer_secret: process.env.TWITTER_API_SECRET_KEY
            // token: oauth_token
          },
          json: true 
        }, function (err, r, body) {
            if (err) {
              return res.send(500, { message: err.message });
            }        
            tweetsHtml.push(body.html);
            if(tweetsHtml.length == req.authors.length) {
              res.status(200).send(JSON.stringify(tweetsHtml));
            }
        });
      })
    });

    module.exports = router;