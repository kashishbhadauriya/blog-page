const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Blog = require("../models/blog");
const User = require("../models/user");

const router = express.Router();

// 🔧 Multer Config for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.resolve(`./public/uploads/${req.user._id}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ✅ Add Blog Page
router.get('/add-new', (req, res) => {
  res.render('addBlog', { user: req.user });
});

// ✅ Create Blog
router.post('/', upload.single('coverimage'), async (req, res) => {
  try {
    const { title, body } = req.body;
    const coverImagePath = req.file ? `/uploads/${req.user._id}/${req.file.filename}` : null;

    await Blog.create({
      title,
      body,
      coverImageURL: coverImagePath,
      createdBy: req.user._id
    });

    res.redirect('/myblogs');
  } catch (error) {
    console.error("❌ Blog creation error:", error);
    res.status(500).send("Failed to create blog.");
  }
});

// ✅ View All Blogs (Profile page)
router.get('/profile', async (req, res) => {
  try {
    const blogs = await Blog.find().populate('createdBy').sort({ createdAt: -1 });
    res.render('bloglist', { user: req.user, blogs });
  } catch (error) {
    console.error("❌ Profile load error:", error);
    res.status(500).send("Failed to load blogs.");
  }
});

// ✅ My Blogs Page (Dashboard)
router.get('/my-blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ createdBy: req.user._id })
      .populate("createdBy")
      .sort({ createdAt: -1 });

    res.render('myBlogs', { user: req.user, blogs });
  } catch (err) {
    console.error("❌ My blogs error:", err);
    res.status(500).send("Failed to load your blogs");
  }
});

// ✅ Delete Blog
router.post('/delete', async (req, res) => {
  try {
    const blog = await Blog.findById(req.body.id);
    if (!blog) return res.status(404).send("Blog not found");
    if (String(blog.createdBy) !== String(req.user._id)) return res.status(403).send("Unauthorized");

    await Blog.findByIdAndDelete(req.body.id);
    res.redirect('/user/my-blogs');
  } catch (err) {
    console.error("❌ Error deleting blog:", err);
    res.status(500).send("Server error");
  }
});

// ✅ View Single Blog with Comments — GET /blog/:id
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('createdBy', 'FullName')
      .populate('comments.createdBy', 'FullName');

    if (!blog) return res.status(404).send("Blog not found");

    res.render('blogDetail', { blog, user: req.user });
  } catch (err) {
    console.error("❌ Blog load error:", err);
    res.status(500).send("Error loading blog");
  }
});

// ✅ Post a Comment — POST /blog/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    blog.comments.push({
      text: req.body.content,
      createdBy: req.user._id,
      createdAt: new Date()
    });

    await blog.save();
    
    res.redirect(`${req.baseUrl}/${req.params.id}`); // 👈 THIS IS THE FIX
  } catch (err) {
    console.error("❌ Comment error:", err);
    res.status(500).send("Failed to add comment");
  }
});




// ✅ Delete Comment by ID (comment index)
router.post('/blog/:blogId/comments/:commentIndex/delete', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).send("Blog not found");

    const comment = blog.comments[req.params.commentIndex];
    if (!comment) return res.status(404).send("Comment not found");

    // Check if logged-in user is the comment creator
    if (String(comment.createdBy) !== String(req.user._id)) {
      return res.status(403).send("Unauthorized to delete this comment");
    }

    // Remove the comment
    blog.comments.splice(req.params.commentIndex, 1);
    await blog.save();

    res.redirect(`/blog/${req.params.blogId}`);
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
    res.status(500).send("Failed to delete comment");
  }
});



// ✅ Delete all comments of a blog post (only blog creator can do this)
router.post('/blog/:id/comments/delete-all', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    // ✅ Only the creator of the blog can delete all comments
    if (String(blog.createdBy) !== String(req.user._id)) {
      return res.status(403).send("Unauthorized to delete comments");
    }

    blog.comments = []; // ✅ Clear all comments
    await blog.save();

    res.redirect(`/blog/${req.params.id}`);
  } catch (err) {
    console.error("❌ Error deleting all comments:", err);
    res.status(500).send("Failed to delete comments");
  }
});
// ✅ Correct Comment Route
// In routes/blog.js (or wherever your routes are defined)
router.post('/blog/:id/comments',async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    blog.comments.push({
      text: content,
      createdBy: req.user._id,
      createdAt: new Date()
    });

    await blog.save();
    res.redirect(`/blog/${id}`);
  } catch (error) {
    console.error("Comment Error:", error);
    res.status(500).send("Failed to add comment");
  }
});






// ✅ Public Profile of a User
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ FullName: new RegExp(`^${req.params.username}$`, 'i') });
    if (!user) return res.status(404).render('userNotFound', { username: req.params.username });

    const blogs = await Blog.find({ createdBy: user._id }).sort({ createdAt: -1 });
    res.render('userProfile', { user, blogs });
  } catch (error) {
    console.error("❌ User profile error:", error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
