const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Blog = require('../models/blog');
const { checkForAuthenticationCookies } = require('../middlewares/authentication');

// POST a comment
router.post('/:blogId', checkForAuthenticationCookies("token"), async (req, res) => {
  try {
    const { blogId } = req.params;
    const { text } = req.body;

    if (!req.user) {
      return res.redirect('/user/signin');
    }

    // Create and save the comment
    const comment = await Comment.create({
      text,
      blogid: blogId,
      createdBy: req.user._id
    });

    // Optionally: add comment ID to blog (if you're storing it inside blog)
    // await Blog.findByIdAndUpdate(blogId, { $push: { comments: comment._id } });

    res.redirect(`/blog/${blogId}`);
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).send("Failed to post comment");
  }
});

module.exports = router;
