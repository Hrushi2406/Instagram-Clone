var express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

var app = express();
const ejs = require("ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(session({
  secret: "This is our secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/InstagramDB', {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String,
    bio:String,
    profileImage: String,
    images: []
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('user', userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// HOME
app.get("/", function (req, res) {
  res.render("home");
});

// SIGNUP
app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {

  User.register({username: req.body.username, email: req.body.email, bio: "HI there its you", profileImage: "girl1.jpg"}, req.body.password,function (err, user) {
      if(err){
        console.log(err);
        res.redirect("/register");
      }else{
        passport.authenticate("local")(req, res, function () {
          console.log(err);
          res.redirect("/profile/" + req.body.username);
        });
      }
  });
});


// LOGIN
app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function (err) {
      if(err){
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/profile/" + req.body.username);
        });
      }
    });
});


// LogOut
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


// PROFILE
app.get("/profile/:userName", function (req, res) {
  const requestedUserName = req.params.userName;

  if(req.isAuthenticated()){
    User.findOne({username: requestedUserName}, function (err, foundUser) {       //findingUser
      if(foundUser){
        const bio = foundUser.bio;
        const img = foundUser.profileImage;
        res.render("profile", {username: requestedUserName, bio: bio, profileImg: img});
      } else {
        console.log(err);
      }
    });
    } else {
      res.redirect("/login");
    }
});

// CHANGE PROFILE PICTURE
app.get("/profile/:userName/changeprofile", function (req, res) {
  const requestedUserName = req.params.userName;

    if(req.isAuthenticated()){
      res.render("changeprofile", {username: requestedUserName});
    } else {
      res.redirect("/login");
    }
});


app.patch("/profile/:userName/profileImg", function (req, res) {
  console.log(req.body.changedprofile);
    User.update (
      {username: req.params.userName},
      {$set: {profileImage: req.body.changedprofile}},
      function (err) {
        if(err){
          console.log(err);
        } else {
          console.log("Successfully updated");
          res.redirect("/profile/" + req.params.userName);
        }
      }
    );
});

// EDITBIO
app.get("/profile/:userName/editbio", function (req, res) {

  if(req.isAuthenticated()){
     res.render("editbio",{username: req.params.userName});
   } else {
     res.redirect("/login");
   }
});

app.patch("/profile/:userName/bio", function (req, res) {

    User.update (
      {username: req.params.userName},
      {$set: {bio: req.body.editedBio}},
      function (err) {
        if(err){
          console.log(err);
        } else {
          console.log("Successfully updated");
          res.redirect("/profile/" + req.params.userName);
        }
      }
    );
});


// EDIT USSERNAME
app.get("/profile/:userName/editUsername", function (req, res) {
  if(req.isAuthenticated()){
    res.render("editUsername", {username: req.params.userName});
  } else {
    res.redirect("/login");
  }
});

app.patch("profile/:userName/UserName", function (req, res) {

  User.update (
    {username: req.params.userName},
    {$set: {username: req.body.editedUsername}},
    function (err) {
      if(err){
        console.log(err);
      } else {
        console.log("Successfully updated");
        res.redirect("/profile/" + req.body.editedUsername);
      }
    }
  );
});

app.get("/profile/:userName/feed", function (req, res) {
    const requestedUserName = req.params.userName;

  User.findOne({username: requestedUserName}, function (err, foundUser) {

    if(err) {
      console.log(err);
    } else {

      if(req.isAuthenticated()){

        User.find({},function (err, foundUsers) {

          console.log(foundUsers);
            res.render("feed", {username: requestedUserName, profileImg: foundUser.profileImage, userFriends: foundUsers});
        });
        } else {
          res.redirect("/login");
        }

    }
  });

});

app.get("/profile/:userName/profile", function (req, res) {
  const requestedUserName = req.params.userName;

  if(req.isAuthenticated()){
    User.findOne({username: requestedUserName}, function (err, foundUser) {       //findingUser
      if(foundUser){
        const bio = foundUser.bio;
        const img = foundUser.profileImage;
        res.render("profileForOthers", {username: requestedUserName, bio: bio, profileImg: img});
      } else {
        console.log(err);
      }
    });
    } else {
      res.redirect("/login");
    }
});


// CHAT SYSTEM

app.get("/:userName/chats", function (req, res) {
  const requestedUserName = req.params.userName;

  User.findOne({username: requestedUserName}, function (err, foundUser) {

    if(err) {
      console.log(err);
    } else {

      if(req.isAuthenticated()){

        User.find({},function (err, foundUsers) {

          console.log(foundUsers);
            res.render("chats", {username: requestedUserName, profileImg: foundUser.profileImage, userFriends: foundUsers});
        });
        } else {
          res.redirect("/login");
        }

    }
  });

});



//
// app.get("/profile", function (req, res) {
//   if(req.isAuthenticated()){
//     res.render("profile");
//   } else {
//     res.redirect("/login");
//   }
// });


app.listen(3000,function () {
  console.log("Server started at port 3000 Successfully");
});
