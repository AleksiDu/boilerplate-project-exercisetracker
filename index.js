//Import Libraries
const express = require('express'); // Loads Express web framework for Node.js;
const app = express(); //App
const cors = require('cors'); // CORS is a Node.js package for Express middleware that enables Cross-origin resource sharing(CORS);
const mongo = require('mongodb'); // MongoDB is a source-available cross-platform document-oriented database program;
const mongoose = require('mongoose'); // Mongoose is a JavaScript object-oriented programming library that creates a connection between MongoDB and the Express web application framework;
const bodyParser = require('body-parser'); // Node.js body parsing middleware/ Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
require('dotenv').config(); // Loads environment variables from a .env files into process.env;

// Middleware function(s)
app.use(cors()); // Enable All CORS Requests;
app.use(express.static('public')); // Serving static  CSS files in Express;
// Routes HTTP GET requests to the HTML callback functions
app.get('/', (_req, res) => {
  res.sendFile(__dirname + '/views/index.html')
}); 

// Basic Configuration
mongoose.connect(process.env.MONGO_URI); // Data Base Connection;

// Data Base Connection Check
let databaseConCeck = mongoose.connection; 
//Listen for error events on the connection;
databaseConCeck.on('error', console.error.bind(console, 'Connection Error'));
databaseConCeck.once('open', () => {
  console.log("Connected To MongoDB");
});

// #4 Exercise Tracker
let jsonParser = bodyParser.json(); // Create application/json parser
let urlencodedParser = bodyParser.urlencoded({ extended: false }); // create application/x-www-form-urlencoded parser

// Mongoose Model & Schema
const userSchema = new mongoose.Schema({
  username: String
});
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});
const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: Array
});
const NewUser = mongoose.model('NewUser', userSchema); //
const NewExercise = mongoose.model('NewExercise', exerciseSchema);
const NewLog = mongoose.model('NewLog', logSchema);


// POST users && Generate IP
app.post('/api/users/', urlencodedParser, (req, res) => {
  NewUser.find({ username: req.body.username }, (err, userDate) => {
    if (err) {
      console.error("Error with server=>", err); //Error check
      
    } else if (userDate.length === 0) { //If no user name check
      const test = new NewUser({ 
        _id: req.body.id,
        username: req.body.username
      });
      test.save((_err, data) => {
        if (err) {
          console.error("Error Saving Data=>", err); //Error check
        } else {
          res.json({
            _id: data.id,
            username: data.username
          });
        }
      });
    } else {
      res.send("User Alrady Exists");
    }
  });
});

// Get request to /api/users/ ip and username 
app.get('/api/users/', (_req, res) => {
  NewUser.find({}, (err, data) => {
    if (err) {
      res.send("No Users", err);
    } else {
      res.json(data);
    }
  });
});

// POST data description, duration, and optionally date.
//Youtube link from where code was taken https://www.youtube.com/watch?v=qw1TCUMqJPQ&ab_channel=MazorSharp 
app.post('/api/users/:_id/exercises', urlencodedParser, (req, res) => {
  let idJson = { id: req.params._id }; // Inserted Id parameter
  let checkDate = new Date(req.body.date); // Check Date
  let idToCheck = idJson.id; // Check Inserted Id
  // Check date Handler
  let noDateHandler = () => {
    if (checkDate instanceof Date && !isNaN(checkDate)) { // If Date was inserted
      return checkDate;
    } else {
      checkDate = new Date(); // If not returns current
    }
  }
  NewUser.findById(idToCheck, (err, data) => {
    noDateHandler(checkDate); // Run Date Handler

    if (err) {
      console.error("Error With Id =>", err); //Error check
    } else {
      const test = new NewExercise({
        username: data.username,
        description: req.body.description,
        duration: req.body.duration,
        date: checkDate.toDateString()
      });

      test.save((err, data) => {
        if (err) {
          console.error("Error With Saving =>", err); //Error check
        } else { 
          console.log("Successfull Save");
          res.json({
            _id: idToCheck,
            username: data.username,
            description: data.description,
            duration: data.duration,
            date: data.date.toDateString()
          });
        }
      });
    }
  });
});

// Exercises log back
app.get('/api/users/:_id/logs/', urlencodedParser, (req, res) => {
  const { from, to, limit } = req.query;
  let idJson = { id: req.params._id };
  let idToCheck = idJson.id;

  // Check ID
  NewUser.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username
    }

    // Test from value
    if (from !== undefined && to === undefined) {
      query.date = { $gte: new Date(from) }
    } else if (to !== undefined && from === undefined) {
      query.date = { $lte: new Date(to) }
    } else if (from !== undefined && to !== undefined) {
      query.date = { $gte: new Date(from), $lte: new Date(to) }
    }

    // Check limit
    let limitChecker = (limit) => {
      let maxLimit = 100;
      if (limit) {
        return limit;
      } else {
        return maxLimit;
      }
    }


    if (err) {
      console.error("Error with ID =>", err); //Error check
    } else {
      //Find the limit
      NewExercise.find((query), null, { limit: limitChecker(+limit) }, (err, docs) => { 
        let loggedArray = [];
        if (err) {
          console.error("Error With Query =>", err); //Error check
        } else {
          let documents = docs;
          loggedArray = documents.map((item) => {
            return {
              description: item.description,
              duration: item.duration,
              date: item.date.toDateString()
            }
          });

          const test = new NewLog({
            username: data.username,
            count: loggedArray.length,
            log: loggedArray,
          });

          test.save((err, data) => {
            if (err) {
              console.error("Error With Saving Exercise =>", err); //Error check
            } else {
              console.log("Save Exercise Successfully");
              res.json({
                _id: idToCheck,
                username: data.username,
                count: data.count,
                log: loggedArray
              });
            }
          });
        }
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
