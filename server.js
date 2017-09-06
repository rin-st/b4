// server.js
// where your node app starts

// init project
var express = require('express');
var url = require('url');
var imageSearch = require('node-google-image-search');
var app = express();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var dbUrl = process.env.MONGOLAB_URI;

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

//-------------------Image Search -----------------------
app.get("/api/imagesearch/:zSearch", function (request, response) {
  var q = url.parse(request.url, true);
  var qData = q.query; //объект здесь
  var offset = q.query.offset;
  var qPath = q.pathname; //путь здесь
  var d = decodeURIComponent(request.params.zSearch);//параметры поиска
  
  var results = imageSearch(d, callback, offset, 10);//предпоследнее оффсет, последнее количество результатов
  function callback(results){
    var resArray = [];
    for (var i = 0; i<results.length; i++){
      resArray[i] = {};
      resArray[i].url = results[i].link;
      resArray[i].snippet = results[i].snippet;
      resArray[i].thumbnail = results[i].image.thumbnailLink;
      resArray[i].context = results[i].image.contextLink;
    }
    response.send(resArray);
  };
  
  MongoClient.connect(dbUrl, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', dbUrl);

      var date = new Date();

      db.collection('GoogleSearch').insert({"term": d,"when": date.toISOString() }); //доделать время   date.toString()  replace(/\//g, '\\///')
      db.close();
    }    
});
                      
  //response.end();
  //response.send(d);
});

// --------------Last responses here-----------------
app.get("/api/latest/imagesearch/", function(request, response){
    MongoClient.connect(dbUrl, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', dbUrl);
      var cursor = db.collection('GoogleSearch').find({},{"_id":0}).toArray(function(err, data){
        if (data) {
          response.send(data);
        }
        else response.end('Error: this url is not on the database')
      });
      db.close();
    }    
});
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
