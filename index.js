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
})
const NewUser = mongoose.model('NewUser', userSchema);
const NewExercise = mongoose.model('NewExercise', exerciseSchema);
const NewLog = mongoose.model('NewLog', logSchema);

app.post('/api/users/', urlencodedParser, (req, res) => {
  NewUser.find({ username: req.body.username }, (err, userDate) => {
    if (err)  {
      console.error("Error with server=>", err);
    } else if (userDate.length === 0) {
      const test = new NewUser({
        _id: req.body.id,
        username: req.body.username
      });
      test.save((err, data) => {
        if (err) {
          console.error("Error Saving Data=>", err)
        } else {
          res.json({
            _id: data.id,
            username: data.username
          })
        }
      })
    } else {
      res.send("User Alrady Exists");
    }
  });
});

app.get('/api/users/', (req, res) => {
  NewUser.find({}, (err, data) => {
    if (err) {
      res.send("No Users", err)
    } else {
      res.json(data);
    }
  });
});

app.post('/api/users/:_id/exercises', urlencodedParser, (req, res) => {
 let idJson = { id: req.params._id};
 let checkDate = new Date(req.body.date);
 let idToCheck = idJson.id;
 let noDateHandler = () => {
   if (checkDate instanceof Date && !isNaN(checkDate)) {
     return checkDate;
   } else {
     checkDate = new Date();
   }
 }
  NewUser.findById(idToCheck, (err, data) => {
    noDateHandler(checkDate);

    if (err) {
      console.error("Error With Id =>", err);
    } else {
      const test = new NewExercise({
        username: data.username,
        description: req.body.description,
        duration: req.body.duration,
        date: checkDate.toDateString()
      });

      test.save((err, data) => {
        if (err) {
          console.error("Error With Saving =>", err);
        } else {
          console.log("Successfull Save");
          res.json({
            _id: idToCheck,
            username: data.username,
            description: data.description,
            duration: data.duration,
            date: data.date.toDateString()
          })
        }
      })
    }
  });
});

app.get('api/users/:_id/logs/', urlencodedParser, (req, res) => {
  const { from, to, limit } = req.query;
  let idJson = { id: req.params._id };
  let idToCheck = idJson.id;

  NewUser.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username
    }

    if (from !== undefined && to === undefined) {
      query.date = { $gte: new Date(from)}
    } else if (to !== undefined && from === undefined) {
      query.date = { $lte: new Date(to) }
    } else if ( from !== undefined && to !== undefined) {
      query.date = { $gte: new Date(from), $lte: new Date(to)}
    }

    let limitChecker = (limit) => {
      let maxLimit = 100;
      if (limit) {
        return limit;
      } else {
        return maxLimit;
      }
    }

    if (err) {
      console.error("Error with ID =>", err);
    } else {
      NewExercise.find((query), null, {limit: limitChecker(+limit)}, (err, docs) => {
        let loggedArray = [];
        if (err) {
          console.error("Error With Query =>", err);
        } else {
          let documents = docs;
          let loggedArray = documents.map((item) => {
            return {
              description: item.description,
              duration: item.duration,
              log: item.date.toDateString()
            }
          })

          const test = new NewLog({
            username: data.username,
            count: loggedArray.length,
            log: loggedArray,
          })

          test.save((err, data) => {
            if (err) {
              console.error("Error With Saving Exercise =>", err);
            } else {
              console.log("Save Exercise Successfully");
              res.json({
                _id: idToCheck,
                username: data.username,
                count: data.count,
                log: loggedArray
              })
            }
          })
        }
      })
    }
  })

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
