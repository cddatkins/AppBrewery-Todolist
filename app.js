//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name : String
};

const Item = mongoose.model("item", itemsSchema);
const item1 = new Item({name: "Welcome to your todo list!"});
const item2 = new Item({name: "Hit the + button to add new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("list", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err) console.log(err);
        else console.log("Successfully saved default items to DB");
        res.redirect("/");
      });
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:listName", function(req, res){
  const listName = lodash.capitalize(req.params.listName);
  
  List.findOne({name: listName}, function(err, foundList){
    if(err) console.log(err);
    else{
      if(foundList){
        //Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
      else{
        //Create new List
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+listName);
      }
    }
  });


  //res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.post("/", function(req, res){
  const listName = req.body.list;
  const itemName = req.body.newItem;
  const item = new Item({name: itemName});

  if(listName === "Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name: listName}, function(err, foundList){
      if(err) console.log(err);
      if(foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkBox;
    const listName = req.body.listName;
    if(listName === "Today"){
      Item.findByIdAndDelete(checkedItemId, function(err){
        if(err) console.log(err);
        else
        {
          console.log("Successfully deleted checked item.")
          res.redirect("/");
        }
      });
    }
    else{
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, result){
        if(err) console.log(err);
        else
        {
          res.redirect("/" + listName);
        }
      });
    }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
