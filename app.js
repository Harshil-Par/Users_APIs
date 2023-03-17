const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bodyparser = require("body-parser");
dotenv.config();
const cors = require("cors");
app.use(cors());

const { connectDb } = require("./middleWares/connections");

connectDb();

const { userRouter } = require("./controller/user");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use("/user", userRouter);

app.listen(process.env.port, () => {
  console.log("server is running on ,", process.env.port);
});
