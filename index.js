require('dotenv').config();
console.log("JWT_SECRET:", process.env.JWT_SECRET); 

const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { checkForAuthenticationCookies } = require('./middlewares/authentication');

const app = express(); // ✅ Move this up before using `app`

const PORT = 8000;


// MongoDB connection
mongoose.connect('mongodb://localhost:27017/blogify')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/', require('./routes/profile')); // or wherever your route is defined

// ✅ Authentication middleware to set req.user
app.use(checkForAuthenticationCookies("token"));

// ✅ Make `user` available in all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Set EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));

// Routes
app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.get('/', (req, res) => {
  res.render("home");
});
const userRoutes = require('./routes/user');
app.use('/', userRoutes);  // ✅ mount all user routes at "/"


const commentRoute = require('./routes/comment');
app.use('/comment', commentRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
