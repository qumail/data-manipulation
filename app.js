const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const csvtojson = require("csvtojson");
const multer = require('multer');
const ProcessCPULoad = require('process-cpu-usage').ProcessCPULoad;

// Cpu Tracker
const tracker = new ProcessCPULoad();


const app = express()

// Policy Model
const  Policy  = require('./models/policy.model');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

// Multer Definition
const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, './uploads');
    },
    filename(req, file, cb) {
      cb(null, file.originalname);
    },
  });
  const upload = multer({ storage }); 
  
  // DatBase Connection
let port = 2000;

let url = "mongodb://127.0.0.1:27017/policy-db"
console.log(url);
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true,useUnifiedTopology: true }
);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})


//Upload CSV Data File to MongoDB
app.post('/dataupload', upload.single(''), (req, res) => {
    const file = req.file.filename
    csvtojson()
  .fromFile(`./uploads/${file}`)
  .then(csvData => {
    Policy.insertMany(csvData)
  });
    res.send('Upload File Successfully');

})

//Get Policy Info using username

app.get('/policy', (req, res) => {
    const query = req.body.name;
    Policy.find({ firstname: query }, (err, docs) => {
        if (err) {
            console.log(err);
        }
        else {
            docs.map((doc) => {
                const policyInfo = {};
                policyInfo.number = doc.policy_number
                policyInfo.amount = doc.premium_amount
                policyInfo.company_name = doc.company_name
                policyInfo.policy_start_date = doc.policy_start_date
                policyInfo.policy_end_date = doc.policy_end_date
                policyInfo.policy_category = doc.category_name
                policyInfo.userId = doc._id
                res.send(policyInfo);
            })
        }
    })

})

// Aggregated Policy by user
app.get('/aggregatepolicy', (req, res) => {
  const query = req.body.name;
  Policy.aggregate([{ $match: { firstname: query }}], (err, data) => {
    if(err) {
      console.log(err)
    }
    else {
      data.map((doc) => {
        const policyInfo = {};
        policyInfo.number = doc.policy_number
        policyInfo.amount = doc.premium_amount
        policyInfo.company_name = doc.company_name
        policyInfo.policy_start_date = doc.policy_start_date
        policyInfo.policy_end_date = doc.policy_end_date
        policyInfo.policy_category = doc.category_name
        policyInfo.userId = doc._id
        res.send(policyInfo);
    })
    }
  })

})

// Node Server Time Track
  tracker.start((total, user, system) => {
    console.log('CPU Usage: Total: %d, User: %d, System: %d', total, user, system);
    if(total >= 0.2) {
      setTimeout(function () {
        process.on("exit", function () {

            require("child_process").spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached : true,
                stdio: "inherit"
            });
        });
        process.exit(1);
    }, 100)
    }
  }); 


//Server Listening
app.listen(port, () => {
    console.log('Server is up and running on port number ' + port);
});