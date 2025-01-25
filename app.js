if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const app =express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


const dbUrl = process.env.ATLASDB_URL;

main().then((res)=>{
    console.log("Connected to DataBase");
}).catch((err)=>{
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

//views
app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
//express
app.use(express.urlencoded ({extended:true}));
app.use(methodOverride("_method"));
//css
app.use(express.static(path.join(__dirname, 'public')));

//mongoStore
const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600, //for lazy update
});

store.on("error",()=>{console.log("ERROR IN MONGO_SESSION",err)});

//express session
const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge:7 * 24 * 60 * 60 * 1000,
        httpOnly:true,
    }
};

//Root 
app.get("/",(req,res)=>{
    res.redirect("/listings")
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});


//ejs
app.engine("ejs",ejsMate);

//listings
app.use("/listings",listingRouter);
//Reviews
app.use("/listings/:id/reviews",reviewRouter);
//user router
app.use("/",userRouter);

//ExpressError
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not Found."));
});

//Error Handling
app.use((err,req,res,next)=>{
    let{statusCode=500,message="something went wrong"}=err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

//app listening
app.listen(2020,(req,res)=>{
    console.log(`app is listening on port 2020`);
});
