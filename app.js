//jshint esversion:6
//we have required express here for setting up our server
const express = require("express");
//body parser for using the form data inside our app.js /node
const bodyParser = require("body-parser");
//mongoose for adding mongodb database to our nodejs app
const mongoose = require("mongoose");
const _ = require("lodash");
//we have required express and made "app" here for setting up our server.
const app = express();
//we are setting u pview engine as ejs.(embedded javascript template)
app.set('view engine', 'ejs');
//part of body parser ,whenever u will be using body pars3r ,e  will have to use this.
app.use(bodyParser.urlencoded({extended: true}));
//we are telling that  all the statcis files  will be inside the folder name public
app.use(express.static("public"));
//we are connecting our database to the mongodb  cluster.
mongoose.connect("mongodb+srv://admin-harsh:Test123@cluster0.whpfi.mongodb.net/todolistDB", {useNewUrlParser: true});
//we have created the schema of the data that  will be enetered.
const itemsSchema = {
  name: String
};
//out of that schema we are creating the mongoose model based on the schema
const Item = mongoose.model("Item", itemsSchema);
//out of the model created ,we are now creating the object or document.
const item1 = new Item({
  name: "Welcome to your todolist!"
});
//out of the model created ,we are now creating the object or document.
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
//out of the model created ,we are now creating the object or document.
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
//out of the documents/object we created ,now we will create
const defaultItems = [item1, item2, item3];

//this is we created for dynamic routes we wil be cretaing in future
//every new route.list that we  wil create using /work ,/soni
//we are going to have a name of the list and then an array of items.
const listSchema = {
  name: String,
  items: [itemsSchema]
};
//we ahve created a lit model our of the list schema..
const List = mongoose.model("List", listSchema);

//handling our root home page.
//finding items inside our model(db) using model.find({},function(){})
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    //if db is empty ,insert default items.
    if (foundItems.length === 0) {
      //then we wil insert our whole array into the db.
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      //after inserting,recheck if we have items or not by redirecting
      res.redirect("/");
    } else {
      //if we already have items then render them  to list.ejs
      //we will render all the data found inside into the list.ejs
      //title we gave is  "today" instead of the date
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

//and when /custom name is searched
//express allow us to use route parameters and cretae dynamic routes
app.get("/:customListName", function(req, res){
  //req.params.customListName will give us
  const customListName = _.capitalize(req.params.customListName);
  //now in the list model we will search for the existing customname (/customname)

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list with the custom names
        //items wud be the default items that we already have
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        //then we  will save that list(only if there was  no list found)
        list.save();
        //then move back to the custom list created
        res.redirect("/" + customListName);
      } else {
        //if the list with the custom name was found then just render that list in list.ejs
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

//when we have a form at home page
//we are picking ut item names and
app.post("/", function(req, res){
  //we are picking up items from form using body parser
  const itemName = req.body.newItem;
  //we are picking up the listname.
  const listName = req.body.list;
  //creating new object ,document using the item we have
  const item = new Item({
    name: itemName
  });
//we are checking listname
  if (listName === "Today"){
    //i.e we have our default list den hit save
    item.save();
    //save krne ke baad redirect to our page  only.
    res.redirect("/");
  } else {
    //but if we are not on default list page,
    //then find customlistname then in that array we will push our item
    //List is modelname modelName.findone({},function({}))
    List.findOne({name: listName}, function(err, foundList){
      //now wer will push our item inside the array "items" that we already have.
      foundList.items.push(item);
      //then we  will save the collection again
      foundList.save();
      //and will redirect to our custom homepage
      res.redirect("/" + listName);
    });
  }
});

//when delete item checked is clicked.
app.post("/delete", function(req, res){
  //we have got id of the check box through "value"
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;//title of the list can be default "today" and may be customListName
  if (listName === "Today") {
    //this is a function , we pass the id and delete the data
    //when the list is default list "Today"
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    //when the list is not "Today" and has custrom list name
    //find list with that custom names
    //then from that list find the item with the given id ,and pull that item out of that list of items
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});

//we are deciding the file to be rendered ,if someone will be going to the /about
app.get("/about", function(req, res){
  res.render("about");
});


//we have done this so that our files can run both on local machine as well as heroku
let port = process.env.PORT;//this is for heroku
if (port == null || port == "") {
  port = 3000;//this is for local machine
}

//we have settuped our server usiong express.
app.listen(port, function() {
  console.log("Server started on port of heroku or maybe 3000");
});
