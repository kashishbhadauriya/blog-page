const express = require('express');
const router = express.Router();

router.get('/profile', async (req, res) => {
  try {
    const blogs = await Blog.find().populate('createdBy');
    res.render('profile', { blogs });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
