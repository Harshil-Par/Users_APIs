const { model, Schema } = require("mongoose");

const user = new Schema(
  {
    email: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

const UserModel = model("user", user);
module.exports = { UserModel };
