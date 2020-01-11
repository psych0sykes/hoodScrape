var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = 3000;
var app = express();


app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/hoodscrape", { useNewUrlParser: true });


function titleMatch (title,cb){
  db.Article.findOne({title: title}).then(
    function(dbTitle){
      if(dbTitle === null){
        cb();
      }
      else{
        console.log("OLD MATCH");
      };
    }).catch(function(err) {
    console.log(err);
  });
};


app.get("/scrape", function(req, res) {

  axios.get("https://blog.robinhood.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $(".entry-title").each(function(i, element) {
      
      
      console.log(this);

      var result = {};
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

        console.log("==============================>");
        console.log(result.title);
        console.log("==============================>");

      titleMatch(result.title, function(){
        console.log("NEW ARTICLE")
        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            console.log(err);
          });
          res.send("Scrape Complete");
      })
    });
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
