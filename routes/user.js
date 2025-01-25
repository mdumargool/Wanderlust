const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirect } = require("../middleware.js");
const userController = require("../controllers/users.js");

//signup
router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

//login
router.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirect, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),userController.login );

//logout
router.get("/logout",userController.loguot);

module.exports = router;