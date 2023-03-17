const { UserModel } = require("./schema/user");

const updateUser = async (user, pass) => {
  const val = await UserModel.updateOne(
    { _id: user._id },
    {
      password: pass,
    }
  );
};

module.exports = updateUser;
