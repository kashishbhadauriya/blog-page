const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async function (req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) return res.redirect("/login");

    req.user = user;               // ✅ Attach user to request
    res.locals.user = user;        // ✅ Useful for EJS templates
    next();
  } catch (err) {
    console.error("JWT verify failed:", err);
    return res.redirect("/login");
  }
};
