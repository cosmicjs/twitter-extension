'use strict';

var express = require('express'),
  reqtoken = require('./routes/reqtoken'),
  login = require('./routes/login'),
  search = require('./routes/search'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  path = require('path');

var app = express();

app.use(express.static(path.join(__dirname, 'client/build')));

// enable cors
var corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['x-auth-token']
};
app.use(cors(corsOption));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use('/api/twitter/reqtoken',  reqtoken);
app.use('/api/twitter/login',  login);
app.use('/api/twitter/search', search);

app.use('/callback', (req, res, next) => {
  res.status(200).send("Redirecting you back to the application");
})

app.listen(process.env.PORT || 4000)
module.exports = app;

console.log('Server running at http://localhost:4000/');