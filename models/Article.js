var mongoose = require("mongoose"); //object data mode (ODM) for MongoDB

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
    headline: String, 
    summary: String, 
    url: String,
    note: { type: Schema.Types.ObjectId, ref: "Note" } 
});

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;