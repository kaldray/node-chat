// SERVER

const xss = require("xss");
const seedColor = require("seed-color");

module.exports = function (io) {
  const connectedUser = [];
  const antiSpam = new AntiSpan();

  io.on("connection", (socket) => {
    console.log("Socket connected +" + socket.id);

    // Récuperer les users depuis le coté client
    // Des qu'on a recu un psuedo on mets la liste a jour
    socket.on("user-pseudo", (pseudo) => {
      console.log("User pseudo: " + pseudo);
      connectedUser.push({
        id: socket.id,
        pseudo,
        color: seedColor(pseudo).toHex(),
      });
      io.emit("users:list", connectedUser);
    });

    socket.on("user:message", (message) => {
      // Enmpecher les chaines de caracteres vides
      if (message.message.trim() === "") return;

      message.message = xss(message.message, {
        whiteList: {},
      });

      if (antiSpam.isInList(socket.id)) {
        return console.info(
          `[antispan]: Message from ${message.pseudo} blocked `
        );
      }

      message.color = seedColor(message.pseudo).toHex();

      io.emit("user:message", message);

      // Ajout dans la liste antiSpan
      antiSpam.addList(socket.id);
    });

    // recuperer l'input de l'utilisateurqui est en train d'écrire

    // Dès que le serveur reçoit l'info de qqn en train d'écrire
    socket.on("user:typing", (user) => {
      // Envoie à tout le monde SAUF à l'émetteur
      socket.broadcast.emit("user:typing", {
        pseudo: user.pseudo,
        id: socket.id,
      });
    });

    // Si un user se deconnecte , on met a jour la liste
    socket.on("disconnect", (reason) => {
      let disconnectedUser = connectedUser.findIndex((user) => {
        return user.id === socket.id;
      });
      if (disconnectedUser > -1) {
        connec.splice(disconnectedUser, 1);
        io.emit("users:list", connectedUser);
      }
    });
  });
};

class AntiSpan {
  static COOL_Time = 2000;

  constructor() {
    this.spamList = [];
  }

  addList(socketID) {
    if (!this.isInList(socketID)) {
      this.spamList.push(socketID);

      setTimeout(() => this.removeFromList(socketID), AntiSpan.COOL_Time);
    }
  }

  removeFromList(socketID) {
    let index = this.spamList.indexOf(socketID);
    if (index > -1) {
      this.spamList.splice(index, 1);
    }
  }

  isInList(socketID) {
    return this.spamList.includes(socketID);
  }
}
