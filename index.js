const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const nocache = require("nocache");
const breadcrumbs = require("./middleware/breadcrumbs");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport"); // Update the path if necessary

// Connect to MongoDB with the FurnSpace db name
const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(nocache());
app.use(breadcrumbs);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/FurnSpace",
    }),
    cookie: { secure: false },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(
  "/dashboard-assets",  
  express.static(path.join(__dirname, "dashboard-assets"))
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

const authRoute = require("./routes/authRoutes"); // Add this line
app.use("/", authRoute); // Add this line

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
