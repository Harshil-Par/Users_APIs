const { OtpModel } = require("./schema/otp");

const deleteOtpRecord = async (email) => {
  const otpRecord = await OtpModel.findOneAndRemove({ email: email });
  return otpRecord ? otpRecord : null;
};

module.exports = deleteOtpRecord;
