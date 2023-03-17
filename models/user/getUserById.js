const { UserModel } = require("./schema/user");

const getUserById = async (_id) => {
  const user = await UserModel.findById(_id);
  return user;
};

module.exports = getUserById;
