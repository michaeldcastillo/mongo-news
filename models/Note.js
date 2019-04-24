var mongoose = require("mongoose"); //object data mode (ODM) for MongoDB

var Schema = mongoose.Schema;

var NoteSchema = new Schema({ 
    title: String, 
    body: String 
});

var Note = mongoose.model("Note", NoteSchema);

module.exports = Note;