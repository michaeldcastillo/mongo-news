var express = require("express"); //web application framework
var mongoose = require("mongoose"); //object data model (ODM) for MongoDB
var axios = require("axios"); //promise-based AJAX
var cheerio = require("cheerio"); //parse, traverse, manipulate API data server-side (similar to jQuery)

var db = require("./models"); //require all database models in the models folder


var PORT = 8080;

var app = express(); //initialize express web application

//configure middleware... in other words, handle what happens with request/response
app.use(express.urlencoded({ extended: true })); //parse request body as JSON
app.use(express.json()); //parse request body as JSON
app.use(express.static("public")); //make the public folder a static directory to server up content to the client

//mongoose.connect("mongodb://localhost/newsMongoDB", { useNewUrlParser: true }); //connect to MongoDB

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsMongoDB";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


// =============================== BEGIN ROUTES ===============================



// ------------------------------- GET app.get() -------------------------------

// 0. TEST default page

//app.get('/', (req, res) => res.send('Mongo News'))
app.get("/", function(req, res) {
    res.send("an index.html file in a public directory supersedes this route");
});


// ------------------------------- GET app.get() -------------------------------
// 1. SCRAPE WEBSITE when navigating to this URL

//app.set("json replacer", replacer); //express res.json property transformation rules
//app.set("json spaces", 2); //number of spaces for indentation (when viewing Raw)

app.get("/scrape", function(req, res) {
    
    axios.get("http://www.echojs.com/").then(function(response) {

        //console.log("response = ", response);
        //console.log("response.data = ", response.data);
        
        var $ = cheerio.load(response.data);
        $("article h2").each(function(i, element) {
            
            var dataObj = {}; //empty object for each h2 element found
            dataObj.headline = $(this).children("a").text().trim();
            dataObj.summary = "some hard-coded text summary";
            dataObj.url = $(this).children("a").attr("href").trim();
            console.log("\n\ncheerio dataObj = ", dataObj);
            
            db.Article.create(dataObj).then(function(mongoDoc) {
                console.log("-------------------------------------------------");
                console.log("mongoose create() mongoDoc Article = ", mongoDoc);                
            }).catch(function(err) {console.log(err);});

        });

        //res.send({ key: "value" });
        //res.json({ key: "value" });
        //res.send(response.data);
        res.send("scrape completed");

    });

});


// ------------------------------- GET app.get() -------------------------------
// 2. READ DATABASE (All) when navigating to this URL

app.get("/articles", function(req, res) {
    //res.send("show articles from the database in JSON format");

    db.Article.find({}).then(function(mongoDoc) {
        //console.log("-------------------------------------------------");
        //console.log("mongoose find() mongoDoc Article = ", mongoDoc); 
        res.json(mongoDoc);
    }).catch(function(err) {console.log(err); res.json(err);});

});

// ------------------------------- GET app.get() -------------------------------
// 3. READ DATABASE (One) when navigating to this URL

app.get("/articles/:id", function(req, res) {
    //res.send("show one article from the database in JSON format");

    //db.Article.findOne().populate().then().catch();
    db.Article.findOne({ _id: req.params.id }).populate("note").then(function(mongoDoc) {
        console.log("-------------------------------------------------");
        console.log("mongoose findOne() mongoDoc Article = ", mongoDoc); 
        res.json(mongoDoc);
    }).catch(function(err) {console.log(err); res.json(err);});

});

// ------------------------------- GET app.get() -------------------------------

app.get("/articles/:id/detail", function(req, res) {
    
    db.Article.findOne({ _id: req.params.id }).populate("note").then(function(mongoDoc) {f

        console.log("mongoDoc = ", mongoDoc);
         /* Example mongoDoc...
            {   
                _id: 5cc33b7511f4058842fa95c5,
                headline: 'Angular 8: First Release Candidate released',
                summary: 'some hard-coded text summary',
                url: '/news/31603',
                __v: 0 
            }
        */
        
        var html = "<h4>Article Headline: '" + mongoDoc.headline + "'</h4>" + 
        "<h4>Article ID: " + mongoDoc._id + "</h4>" + 
        "<input id='note-title' name=''><br>" + 
        "<textarea id='note-body' name=''></textarea><br>" + 
        "<button data-id='" + mongoDoc._id + "' id='save-note'>Save Note</button>" + " | " +
        "<button data-id='" + mongoDoc._id + "' class='remove-note'>Remove Note</button>" + " | " +
        "<button data-id='" + mongoDoc._id + "' id='json-api-id'>JSON Data</button>";

        //var html = "<h4>Hello World</h4>";

        res.send(html);

    }).catch(function(err) {console.log("error", err); res.json(err);});

        
           
     
      

});

// ------------------------------- PUT app.put() [delete an article] -------------------------------


app.put("/articles/:id", function(req, res) {
    console.log("req.params.id = ", req.params.id);
    console.log("req.body = ", req.body);

    db.Article.deleteOne({ _id: req.params.id }).then(function(result) {
        console.log("db.Article.deleteOne({ _id: req.params.id })...result = ", result);
        //res.redirect("http://localhost:8080/index.html");
        res.sendStatus(200);
    }).catch(function(err) {console.log(err); res.json(err);});

});

// ------------------------------- PUT app.put() [delete ALL articles] -------------------------------


app.put("/test/remove", function(req, res) {
    console.log("\n\n---------------- TEST ------------------");
    console.log("\n\nreq.body = ", req.body);
    
    db.Article.deleteMany({}).then(function(result) {
        console.log("articles/remove... result = ", result);
        res.json(result);
    }).catch(function(err) {console.log(err); res.json(err);}); 


   /* app.get("/api/delete", function(req, res) {
        db.News.deleteMany({})
          .then(function(dbNews) {
            res.json(dbNews);
          })
          .catch(function(err) {
            res.json(err);
          });
      }); */

});




// ------------------------------- POST app.post() [create a note] -------------------------------

app.post("/articles/:id", function(req, res) {
    console.log("app.post('/articles/"+req.params.id+"') console.log = update and save a comment to an existing article");
    console.log("POST request req.body = dataObj = ", req.body);

    var dataObj = req.body; //this is already an object

    db.Note.create(dataObj).then(function(mongoDocNote) {
        console.log("-------------------------------------------------");
        console.log("mongoose create() mongoDoc Note = ", mongoDocNote); 
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: mongoDocNote._id }, { new: true });
    }).then(function(mongoDocArticle) {
        console.log("-------------------------------------------------");
        console.log("mongoose findOneAndUpdate() mongoDoc Article = ", mongoDocArticle); 
        res.json(mongoDocArticle);
    }).catch(function(err) {console.log(err);});


});



// =============================== END ROUTES ===============================


app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
}); //start the web application server
