const express = require("express");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/user");
const Blog = require("../models/blog"); 
const { checkForAuthenticationCookies } = require('../middlewares/authentication');

const router = express.Router();

// GET: Signin Page
router.get("/signin", (req, res) => {
  return res.render("signin", { error: null });
});

// GET: Signup Page
router.get("/signup", (req, res) => {
  return res.render("signup", { error: null });
});

// POST: Signin (Login)
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.matchPassword(email, password); // custom static method
  if (!user) {
    return res.status(401).render('signin', {
      error: 'Invalid email or password',
    });
  }

  const token = jwt.sign(
    { _id: user._id, email: user.email, FullName: user.FullName },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.cookie("token", token, { httpOnly: true });
  return res.redirect('/blog/add-new');
});

// POST: Signup (Register)
router.post('/signup', async (req, res) => {
  const { FullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('signup', {
        error: 'Email is already registered. Please sign in.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      FullName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { _id: user._id, email: user.email, FullName: user.FullName },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie("token", token, { httpOnly: true });
    return res.redirect('/');
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send("Something went wrong.");
  }
});

// USER SEARCH (e.g. ?username=Simran)
router.get('/user-search', (req, res) => {
  const username = req.query.username;
  res.redirect(`/user/${username}`);
});

// Render public profile page of a user
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ FullName: new RegExp(`^${req.params.username}$`, 'i') });
    if (!user) return res.status(404).send('User not found');

    const blogs = await Blog.find({ createdBy: user._id });
    res.render('userProfile', { user, blogs });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Render all blogs (like homepage)
router.get('/profile', async (req, res) => {
  try {
    const blogs = await Blog.find().populate('createdBy').sort({ createdAt: -1 });
    res.render('bloglist', { user: req.user, blogs });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// My blogs page (only logged-in user's posts)
router.get('/myblogs', async (req, res) => {
  try {
    if (!req.user) return res.redirect('/signin');

    const blogs = await Blog.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.render('myBlogs', { user: req.user, blogs });
  } catch (err) {
    console.error("Error loading my blogs:", err);
    res.status(500).send("Failed to load your blogs");
  }
});

// Search blogs by title
router.get('/search', async (req, res) => {
  const query = req.query.query;
  console.log("Search Query:", query);

  if (!query || query.trim() === "") {
    return res.render('searchResults', { blogs: [], query: "" });
  }

  try {
    const blogs = await Blog.find({
      title: { $regex: query, $options: 'i' }
    });

    res.render('searchResults', { blogs, query });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).send('Error searching blogs: ' + err.message);
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie("token");
  return res.redirect('/');
});

module.exports = router;
