const { UserModel } = require("./schema/user");
const getPopulatedUser = async (_id) => {
  const user = await UserModel.findById(_id);
  return user;
};

module.exports = getPopulatedUser;
