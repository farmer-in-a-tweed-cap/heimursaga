const dotenv = require("dotenv");
dotenv.config();
const { MongoClient } = require("mongodb");

MongoClient.connect(
  process.env.CONNECTIONSTRING,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err, client) {
    module.exports = client;
    const app = require("./app");
    app.listen(process.env.PORT, () =>
      console.log("Listening to port: " + process.env.PORT)
    );
  }
);
