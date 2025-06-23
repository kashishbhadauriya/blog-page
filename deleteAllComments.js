const mongoose = require('mongoose');
const Blog = require('./models/blog');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/blogify')
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Step: Remove all comments from all blog documents
    const blogs = await Blog.find({});

    for (let blog of blogs) {
      blog.comments = []; // Clear comments array
      await blog.save();
      console.log(`🗑 Cleared comments for blog: ${blog.title}`);
    }

    console.log('✅ All comments deleted from all blogs');

    // Close connection
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
