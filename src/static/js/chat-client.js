// CLIENT

const socket = io("/");

const URLQuery = Object.fromEntries(
  new URLSearchParams(window.location.search)
);

const pseudo = URLQuery.pseudo;

socket.emit("user-pseudo", pseudo);

socket.on("users:list", (connectedUsers) => {
  addUser(connectedUsers);
});

const form = document.querySelector(".chatbox-form");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  // Recuperation du message
  const messageEL = form.querySelector("[name=message]");

  if (messageEL.value.trim() === "") {
    return;
  }
  // Creation de l'objet message
  const message = createMessage(messageEL.value);

  // envoie de l'objet messge au serveur
  socket.emit("user:message", message);

  showMessage(message);
});

const messageEL = form.querySelector("[name=message]");

messageEL.addEventListener("input", () => {
  socket.emit("user:typing", { pseudo });
});

// Si on reçoit une info serveur comme quoi qqn écrit …
socket.on("user:typing", (user) => {
  // Vérifier si l'utilisateur n'est pas déjà dans la liste des "typingUsers"
  let typingUser = typingUsers.find((u) => u.id === user.id);

  // S'il est déjà présent dans le tableau, on supprime son ancien timer
  if (typingUser) {
    clearTimeout(typingUser.timer);
  } else {
    // Sinon, on le crée et on l'ajoute au tableau
    typingUser = {
      pseudo: user.pseudo,
      id: user.id,
      timer: null,
    };
    typingUsers.push(typingUser);
  }

  typingUser.timer = setTimeout(() => {
    let index = typingUsers.findIndex((u) => u.id === typingUser.id);
    if (index > -1) {
      typingUsers.splice(index, 1);
      showTypingUsers();
    }
  }, 5000);

  showTypingUsers();
});


// des qu'on recoit un message du serveur de la parrt d'un autre user
socket.on("user:message", (message) => {
  showMessage(message);
});

function addUser(connectedUser) {
  const ul = document.querySelector(".chat-users ul");

  ul.innerHTML = connectedUser
    .map(({ pseudo, id, color }) => {
      let fontColor = calcLuminance(color) > 40 ? "#000000" : "#ffffff";

      return `<li style="background-color: ${color};color: ${fontColor}">${pseudo}</li>`;
    })
    .join("");
}

function createMessage(message) {
  return {
    date: Date.now(),
    pseudo,
    message,
  };
}

function showMessage({ date, pseudo, message, color }) {
  let fontColor = calcLuminance(color) > 40 ? "#000000" : "#ffffff";
  let messageHtml = `<div  class="chat-message">
  <span class="msg-date ">${new Date(date).toLocaleString()}</span>
  <span class="msg-pseudo" style="background-color: ${color};color: ${fontColor}">${pseudo}</span>
  <span class="msg-message">${message}</span>
  `;

  const chatboxMessages = document.querySelector(".chatbox-message");
  chatboxMessages.innerHTML += messageHtml;
  let msg = document.querySelector("[name=message]");
  msg.value = "";

  // fix scroll
  chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
}

function calcLuminance(color) {
  const c = color.substring(1); // strip #
  const rgb = parseInt(c, 16); // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff; // extract red
  const g = (rgb >> 8) & 0xff; // extract green
  const b = (rgb >> 0) & 0xff; // extract blue

  // per ITU-R BT.709

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function showTypingUsers() {
  let html = "";
  typingUsers.forEach((user) => {
    html += `<div>${user.pseudo} est en train d'écrire …</div>`;
  });

  const notifications = document.querySelector(".notification");
  notifications.innerHTML = html;
}