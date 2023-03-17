const { AES, enc } = require("crypto-js");
const Joi = require("joi");
const { isError } = require("joi");
const nodemailer = require("nodemailer");
const moment = require("moment");

const {
  saveUser,
  getUserById,
  getPopulatedUser,
  getUserByEmail,
  updateUser,
} = require("../../models/user");

const {
  saveOtpToDb,
  getOtpRecordByEmailAndOtp,
  deleteOtpRecord,
} = require("../../models/otp");

const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string()
    .email()
    .required()
    .external(async (v) => {
      const user = await getUserByEmail(v);
      if (user) {
        throw new Error(
          "This email address is already associated with another account. Please use a different email address."
        );
      }
      return v;
    }),
  password: Joi.string()
    .required()
    .min(6)
    .custom((v) => {
      return AES.encrypt(v, process.env.PASS_KEY).toString();
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .external(async (v) => {
      const user = await getUserByEmail(v);
      if (!user) {
        throw new Error(
          "This email address is not registered. Please use a registered email address."
        );
      }
      return user;
    }),
  password: Joi.string().required().min(6),
});

const sentOtpSchema = Joi.object().keys({
  email: Joi.string().email().required(),
});

const verifyOtpSchema = Joi.object().keys({
  otp: Joi.string().required().length(6),
  email: Joi.string().email().required(),
});

const resetSchema = Joi.object().keys({
  newPassword: Joi.string().required().min(6),
  otp: Joi.string().required().length(6),
  email: Joi.string().email().required(),
});

const changePassSchema = Joi.object().keys({
  email: Joi.string().email().optional(),
  password: Joi.string().required(),
  newPassword: Joi.string().required().min(6),
});

const register = async (req, res) => {
  try {
    const payload = req.body;

    const payloadValue = await registerSchema
      .validateAsync(payload)
      .then((value) => {
        return value;
      })
      .catch((e) => {
        console.log(e);
        if (isError(e)) {
          res.status(422).json(e);
        } else {
          res.status(422).json({ message: e.message });
        }
      });
    if (!payloadValue) {
      return;
    }

    const user = await saveUser(payloadValue);
    const newUser = await getPopulatedUser(user._id);
    const token = AES.encrypt(
      user._id.toString(),
      process.env.AES_KEY
    ).toString();
    res
      .cookie("auth", token, {
        expires: new Date("12/31/2100"),
        signed: true,
      })
      .status(200)
      .set({ "x-auth-token": token })
      .json(newUser);
  } catch (error) {
    console.log("error in register", error);
    res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

const login = async (req, res) => {
  try {
    const payload = req.body;
    const payloadValue = await loginSchema
      .validateAsync(payload)
      .then((value) => {
        return value;
      })
      .catch((e) => {
        console.log(e);
        if (isError(e)) {
          res.status(422).json(e);
        } else {
          res.status(422).json({ flag: false, message: e.message });
        }
      });

    if (!payloadValue) {
      return;
    }
    const user = payloadValue.email;

    if (
      AES.decrypt(user.password, process.env.PASS_KEY).toString(enc.Utf8) !==
      payloadValue.password
    ) {
      res.status(401).json({ flag: false, message: "Invalid password" });
      return;
    }

    const populatedUser = await getPopulatedUser(user._id);

    const token = AES.encrypt(
      user._id.toString(),
      process.env.AES_KEY
    ).toString();

    res
      .cookie("auth", token, {
        expires: new Date("12/31/2100"),
        signed: true,
      })
      .status(200)
      .setHeader("x-auth-token", token)
      .json(populatedUser);
  } catch (error) {
    console.log("error", "error in login", error);
    res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

const logout = async (req, res) => {
  try {
    res
      .clearCookie("auth", {
        signed: true,
      })
      .status(200)
      .json({ flag: true, message: "Logout" });
  } catch (error) {
    console.log("error", "error in logout ", error);
    res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const authUser = req.authUser;
    const User = await getUserById(authUser._id);
    res.status(200).json(User);
    return;
  } catch (error) {
    console.log("error", "error in getUser ", error);
    res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const payload = req.body; //otp and email
    const payloadValue = verifyOtpSchema.validate(payload).value;
    const error = verifyOtpSchema.validate(payload).error;
    if (error) {
      return res.status(422).json({
        flag: false,
        message: "Invalid otp or email",
      });
    }

    const otpRecord = await getOtpRecordByEmailAndOtp(
      payloadValue.email,
      payloadValue.otp
    );

    if (!otpRecord) {
      return res.status(422).json({
        message: "Invalid otp",
      });
    }

    const currentTime = moment(new Date());
    const otpGenerationTime = moment(otpRecord.createdAt);

    const diff = currentTime.diff(otpGenerationTime, "seconds");

    if (otpRecord) {
      if (diff <= 300) {
        return res.status(200).json({
          flag: true,
          message: "Match Successfully",
        });
      } else {
        await deleteOtpRecord(payloadValue.email, "Verify User");
        return res.status(408).json({
          message: "Time out",
        });
      }
    }
  } catch (error) {
    console.log("error", "error in verifyOtp ", error);
    return res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

const sentOtp = async (req, res) => {
  try {
    const payload = req.body; //email
    const payloadValue = sentOtpSchema.validate(payload).value;
    const error = sentOtpSchema.validate(payload).error;
    if (error) {
      return res.status(422).json({
        flag: false,
        message: "Invalid email",
      });
    }
    const user = await getUserByEmail(payloadValue.email);
    if (!user) {
      return res.status(422).json({
        flag: false,
        message: "Email is not registered",
      });
    }
    await deleteOtpRecord(payloadValue.email);
    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
      },
    });

    const otp = Math.floor(Math.random() * (999999 - 100000)) + 100000;
    const mailDetails = {
      from: process.env.ADMIN_EMAIL,
      to: payloadValue.email,
      subject: "Forget Password OTP",
      text: `Don't share this OTP with anyone. and your OTP is ${otp}`,
    };

    mailTransporter.sendMail(mailDetails, async (err) => {
      if (err) {
        return res.status(550).json({
          message: err,
        });
      } else {
        payloadValue.otp = otp.toString();
        payloadValue.otpType = "forget password";
        await saveOtpToDb(payloadValue);
        return res.status(200).json({
          flag: true,
          message: "Otp sent successfully",
        });
      }
    });
  } catch (error) {
    console.log("error in sending OTP #########", error);
    return res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

const resetPass = async (req, res) => {
  try {
    const payload = req.body; //new password,email and otp
    const payloadValue = resetSchema.validate(payload).value;
    const error = resetSchema.validate(payload).error;
    if (error) {
      return res.status(422).json({
        flag: false,
        message: error.message,
      });
    }
    const otpRecord = await getOtpRecordByEmailAndOtp(
      payloadValue.email,
      payloadValue.otp
    );
    if (!otpRecord) {
      return res.status(422).json({
        flag: false,
        message: "Invalid email or otp",
      });
    }
    const getUser = await getUserByEmail(payloadValue.email);
    const setNewPass = AES.encrypt(
      payloadValue.newPassword,
      process.env.PASS_KEY
    ).toString();
    await updateUser(getUser, setNewPass);

    res.status(200).json({
      flag: true,
      message: "successfully changed",
    });
  } catch (error) {
    console.log("error", "error at get in reset password #########", error);

    res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

const changePass = async (req, res) => {
  try {
    const payload = req.body;
    const payloadValue = await changePassSchema
      .validateAsync(payload)
      .then((value) => {
        return value;
      })
      .catch((e) => {
        if (isError(e)) {
          res.status(422).json(e);
        } else {
          flag: false, res.status(422).json({ message: e.message });
        }
      });
    if (!payloadValue) {
      return;
    }
    const authUser = req.authUser;
    const User = await getUserById(authUser._id);

    if (
      AES.decrypt(User.password, process.env.PASS_KEY).toString(enc.Utf8) !==
      payloadValue.password
    ) {
      res.status(401).json({
        flag: false,
        message: "wrong password",
      });
      return;
    }
    const setNewPass = AES.encrypt(
      payloadValue.newPassword,
      process.env.PASS_KEY
    ).toString();

    await updateUser(User, setNewPass);

    res.status(200).json({
      flag: true,
      message: "successfully changed",
    });
  } catch (error) {
    console.log("error", "error at get in change password #########", error);
    res.status(500).json({
      flag: false,
      message: "Something happened wrong try again after sometime.",
    });
  }
};

module.exports = {
  register,
  login,
  getUser,
  logout,
  sentOtp,
  verifyOtp,
  changePass,
  resetPass,
};
