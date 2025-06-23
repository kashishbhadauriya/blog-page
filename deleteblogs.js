const mongoose = require('mongoose');
const Blog = require('./models/blog'); 

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blogify')
  .then(async () => {
    console.log('Connected to MongoDB');

    // Delete all blogs
    await Blog.deleteMany({});
    //Ye command MongoDB ke blogify DB me blogs collection se saare documents delete karti hai.
//deleteMany({}) ka matlab: match all documents (no filter), and delete all.
  

console.log('All blogs deleted');

    // Disconnect
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
  });
