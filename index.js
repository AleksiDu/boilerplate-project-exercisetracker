const express = require('express');
const app = express();
const cors = require('cors');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const shortid = require('shortid');
const bodyParser = require('body-parser')
require('dotenv').config();


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Basic Configuration
//==================================//
mongoose.connect(process.env.MONGO_URI); // Data Base Connection;

// Data Base Connection Check
let databaseConCeck = mongoose.connection; //Listen for error events on the connection;
databaseConCeck.on('error', console.error.bind(console, 'Connection Error'));
databaseConCeck.once('open', () => {
  console.log("Connected To MongoDB");
});

// #4 Exercise Tracker
// create application/json parser
var jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// Mongoose Model & Schema
const schema = new mongoose.Schema({
  username: String,
  _id: String
});
const NewUser = mongoose.model('ShortURL', schema);

app.post('/api/users/', urlencodedParser, (req, res) => {
  let user = req.body.username;
  console.log(user);
  let id = shortid.generate();

  let newUser = new NewUser ({
    username: user,
    _id: id
  });
  newUser.save((err, doc) => {
    if (err) return console.error.apply(err);
    res.json({
      saved: true,
      username: newUser.username,
      _id: newUser._id
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
