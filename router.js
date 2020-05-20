const express = require('express')
const app = express()
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
var Storage = require('node-storage');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var store = new Storage("myStorage.txt");

//use this once on your server
function createDatabase(){
    MongoClient.connect(url+'myshopdb', function(err, db) {
      if (err) throw err;
      console.log("Database created!");
      db.close();
    });
} 

createDatabase()

function createCollections(){
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      dbo.createCollection("customers", function(err, res) {
        if (err) throw err;
        console.log("customers Collection created!");
        db.close();
      });
    }); 

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      dbo.createCollection("customers_transactions", function(err, res) {
        if (err) throw err;
        console.log("customers_transactions Collection created!");
        db.close();
      });
    }); 

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      dbo.createCollection("customers_checkouts", function(err, res) {
        if (err) throw err;
        console.log("customers_checkouts Collection created!");
        db.close();
      });
    }); 
    

}

createCollections()

function userRegister(username, email, password){
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      var myobj = { username: username, email: email, password: password };
      dbo.collection("customers").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("Inserted", myobj);
        store.put('username', username);
        db.close();
      });
    }); 
}

function storeTransaction(param){
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      var myobj = param;
      dbo.collection("customers_transactions").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("Inserted", myobj);
        db.close();
      });
    }); 
}

function userSignin(username, password){

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      dbo.collection("customers").findOne({username:username, password:password}, function(err, result) {
        //if (err) throw err;
        console.log(result);
        if(result!=null){
          store.put('username', result.username)
          return true
        }
        db.close();
        if(result==null){
          return false
        }
      });

    }); 
    return true
}


//for html
function home()
{
    //for css
    app.use(express.static('public')); //inline
    //displaying html requested page
    app.get('/', function (req, res) {
        return res.redirect('/html');
    })

    app.get('/get_signed_user',(req,res)=>{
        //res.sendFile(__dirname +"/views/test.html",);
        res.json({username: store.get('username')});
    })

    app.get('/get_checkout_details',(req,res)=>{
        //res.sendFile(__dirname +"/views/test.html",);
        res.json({checkout_details: store.get('checkout_details')});
    })

    app.post('/html/login_page.html', function (req, res) {
      console.log("post login_page.html called", req.body)
      //var resp = userSignin(req.body.username, req.body.password)


      MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      dbo.collection("customers").findOne({username:req.body.username, password:req.body.password}, function(err, result) {
        //if (err) throw err;
        console.log(result);
        if(result!=null){
          store.put('username', result.username)
          return res.redirect('/html');
        }
        db.close();
        if(result==null){
          return res.redirect('/html/incorrect_password.html');
        }
      });

    }); 



    });



    app.post('/html/addPaymentMethod.html', function (req, res) {
      console.log("post addPaymentMethod.html called", req.body)
      //var resp = userSignin(req.body.username, req.body.password)
      MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("myshopdb");
      var toInsert = req.body//JSON.parse(req.body)
      dbo.collection("customers_checkouts").insertOne(toInsert, function(err, res) {
        if (err) throw err;
        console.log("Inserted", toInsert);
        store.put('checkout_details', toInsert)
        db.close();
       
      });
    }); 
       return res.redirect('/html/viewCarDetails.html');

    });

    app.post('/html/registration_page.html', function (req, res) {
      console.log("post registration_page.html called")
      userRegister(req.body.username, req.body.email, req.body.password)
      return res.redirect('/html');
    });

    app.post('/html/payment_info.html', function (req, res) {
      console.log("post payment_info.html called", req.body)
      var payload = req.body
      payload.username = store.get('username')
      storeTransaction(payload)
      return res.redirect('/html');
    });

    //displaying form response
    app.post('/', function (req, res) {
      var message = req.body.city;
      console.log(req.body.city);
    })
    
    app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})
}
module.exports.home = home;
