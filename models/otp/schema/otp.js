const { model, Schema } = require("mongoose");

const otp = new Schema(
  {
    email: {
      type: String,
    },
    otp: {
      type: String,
    },
  },
  { timestamps: true }
);

const OtpModel = model("otp", otp);
module.exports = { OtpModel };
