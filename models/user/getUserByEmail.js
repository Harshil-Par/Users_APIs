const { UserModel } = require("./schema/user");

const getUserByEmail = async (email) => {
  const user = await UserModel.findOne({
    email: email,
  });
  return user;
};

module.exports = getUserByEmail;
