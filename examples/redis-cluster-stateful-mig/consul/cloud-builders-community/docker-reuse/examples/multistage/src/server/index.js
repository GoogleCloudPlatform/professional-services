import express from "express";

const app = express();

const greeting = process.env.GREETING || "Hello World!";

app.get("/", function (req, res) {
  res.type("text/plain").send(greeting);
});

const port = parseInt(process.env.SERVER_PORT, 10);

app.listen(port, function () {
  console.log("App listening on port " + port);
});
