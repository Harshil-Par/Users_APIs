var AES = require("crypto-js/aes");
var CryptoJS = require("crypto-js");
const getUserById = require("../models/user/getUserById");

const validateAuthToken = async (req, res, next) => {
  const token = req.headers.authorization || req.signedCookies.auth;

  if (!token) {
    res
      .clearCookie("auth", {
        httpOnly: true,
        signed: true,
      })
      .status(403)
      .json({ message: "Unauthorized request." });
    return;
  }
  const userId = AES.decrypt(token, process.env.AES_KEY).toString(
    CryptoJS.enc.Utf8
  );
  if (!userId) {
    res
      .clearCookie("auth", {
        httpOnly: true,
        signed: true,
      })
      .status(403)
      .json({ message: "Unauthorized request." });
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    res
      .clearCookie("auth", {
        httpOnly: true,
        signed: true,
      })
      .status(403)
      .json({ message: "Unauthorized request." });
    return;
  }

  const userRawData = user.toJSON();
  delete userRawData.password;
  req.authUser = userRawData;
  next();
  return;
};

module.exports = { validateAuthToken };
