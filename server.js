var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);


// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

// Handlebars 
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes

app.get("/scrape", function (req, res) {

  axios.get("http://explosm.net/comics/archive").then(function (response) {

  var $ = cheerio.load(response.data);

    $(".archive-list-item").each(function (i, element) {
      
      var result = {};

      result.title = $(element).find("#comic-author").text();
      result.link = "http://explosm.net" + $(element).find("a").attr("href");
      result.image = $(element).find("img").attr("src");
      console.log(result)

      db.Article.create(result)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");

  });
});

app.get("/articles", function (req, res) {

  db.Article.find({})
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });

});

app.get("/articles/:id", function (req, res) {

  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });

});

app.post("/articles/:id", function (req, res) {

  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { note: dbNote._id } });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });

});

app.get("/notes/:id", function (req, res) {

  db.Note.find({ _id: req.params.id }).populate("Note")
    .then(function (dbNote) {
      res.json(dbNote)
    })
    .catch(function (err) {
      res.json(err)
    });

})

app.delete("/notes/delete/:id", function (req, res) {

  db.Note.deleteOne({ _id: req.params.id })
    .then(function (response) {
      res.json(response)
    })

})
  ;
app.delete("/articles/delete", function (req, res) {

  db.Article.remove({}).then(function (response) {
    res.json(response)
  })

});

app.get("/", function (req, res) {

  db.Article.find({}).then(function (articles) {
    res.render("index", {articles: articles})
  }).catch(function (err) {
    res.json(err)
  })

});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
