const { OtpModel } = require("./schema/otp");

const saveOtp = async (otp) => {
  const savedRecord = await new OtpModel(otp).save();
  return savedRecord;
};

module.exports = saveOtp;
