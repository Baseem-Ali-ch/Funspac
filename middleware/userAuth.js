const isLogin = async (req, res, next) => {
  try {
    if (req.session.user || req.isAuthenticated()) {
      return next();
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user || req.isAuthenticated()) {
      res.redirect("/home");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const isLogoutWishlist = async (req, res, next) => {
  try {
    if (req.session.user) {
      res.render("wishlist", { user: req.session.user });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const isLogoutContact = async (req, res, next) => {
  try {
    if (req.session.user) {
      res.render("contact-us", { user: req.session.user });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const isAdminAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.redirect('/admin');
  }
};



module.exports = {
  isLogin,
  isLogout,
  isLogoutWishlist,
  isLogoutContact,
  isAdminAuthenticated
};
