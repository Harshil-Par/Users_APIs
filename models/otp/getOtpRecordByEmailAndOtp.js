const { OtpModel } = require("./schema/otp");

const getOtpRecordByEmailAndOtp = async (email, otp) => {
  const otpRecord = await OtpModel.findOne({
    email: email,
    otp: otp,
  });

  return otpRecord ? otpRecord : null;
};

module.exports = getOtpRecordByEmailAndOtp;
