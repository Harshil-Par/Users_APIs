const { UserModel } = require("./schema/user");

const saveUser = async (user) => {
  const savedUser = await new UserModel(user).save();
  return savedUser;
};

module.exports = saveUser;
