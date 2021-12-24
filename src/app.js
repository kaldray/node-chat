const express = require("express");
const helmet = require("helmet");
const http = require("http");
const port = 1337;
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
require("./chat-server")(io);

/**
 * Configuration du template
 */
app.set("view engine", "pug");
app.set("views", "./src/views");

/**
 * Midddleware
 */

app.use(helmet());
app.use(express.static("./src/static"));

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/chat", function (req, res) {
  if (!req.query.pseudo) {
    return res.redirect("/");
  }

  const pseudo = req.query.pseudo;
  res.render("chat", { pseudo });
});

server.listen(port, () => {
  console.log(`J'suis un crack !!! HOHO`);
});
