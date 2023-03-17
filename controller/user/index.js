const {
  register,
  login,
  getUser,
  logout,
  sentOtp,
  verifyOtp,
  changePass,
  resetPass,
} = require("./controller");
const { validateAuthToken } = require("../../middleWares/validateAuthIdToken");
const userRouter = require("express").Router();

userRouter.post("/register", register);
userRouter.get("/login", login);
userRouter.get("/getUser/",validateAuthToken, getUser);
userRouter.get("/sentOtp", sentOtp);
userRouter.get("/verifyOtp", verifyOtp);
userRouter.get("/resetPass", resetPass);
userRouter.get("/changePass", validateAuthToken, changePass);
userRouter.get("/logout", validateAuthToken, logout);

module.exports = { userRouter };
