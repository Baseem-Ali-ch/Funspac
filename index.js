const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");

const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const mongoose = require("mongoose");

// Connect to MongoDB with the FurnSpace db name
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log(error);
  });

const app = express();
const port = process.env.PORT || 4000;

// Parse application/json and application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Initialize MongoStore for user and admin sessions
const userStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI, // Ensure this is correctly set in .env
  collectionName: "user_sessions", // Collection for user sessions
});

const adminStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI, // Ensure this is correctly set in .env
  collectionName: "admin_sessions", // Collection for admin sessions
});


app.use(
  session({
    secret: process.env.USER_SESSION_SECRET, // Secret for user sessions
    resave: false,
    saveUninitialized: false,
    store: userStore,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

app.use(
  "/admin",
  session({
    secret: process.env.ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: adminStore,
    cookie: { secure: false },
  })
);

// Configure session middleware for user and admin


// Middleware to set up session for admin routes



// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Serialize and deserialize user
passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

// Serve static files
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(
  "/dashboard-assets",
  express.static(path.join(__dirname, "dashboard-assets"))
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Define routes
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);


app.use("/admin", passport.initialize());
app.use("/admin", passport.session());

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

const authRoute = require("./routes/authRoutes");
app.use("/", authRoute);

// Render index page
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
