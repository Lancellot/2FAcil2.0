// Lista de autenticações com múltiplos usuários
const authDataList = [
  {
    userName: "João Silva", // Nome do usuário
    oabNumber: "ASSADV05112894059", // Número de OAB
    secretKey: "GZSTCZTBGY2TAYJVGM3TIYTCGEYTENRY" // Chave secreta
  },
  {
    userName: "Maria Oliveira",
    oabNumber: "654321-RJ",
    secretKey: "JBSWY3DPEHPK3PXP"
  },
  {
    userName: "Carlos Eduardo",
    oabNumber: "112233-MG",
    secretKey: "MMYWCOJYHEYTMMZZGQZDOZDDGY3GCNZX"
  }
  // Adicione mais usuários conforme necessário
];

// Função que converte a base32 para hexadecimal
function base32ToHex(base32) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";

  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    bits += val.toString(2).padStart(5, "0");
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    hex += parseInt(chunk, 2).toString(16);
  }

  return hex;
}

// Função que gera o HMAC (código de autenticação)
async function generateHMAC(keyHex, counterHex) {
  const key = new Uint8Array(keyHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  const counter = new Uint8Array(counterHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));

  const cryptoKey = window.crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  return cryptoKey.then(key =>
    window.crypto.subtle.sign("HMAC", key, counter)
  );
}

// Função para gerar o TOTP para um único usuário
async function generateTOTPForUser(user) {
  const secretKey = user.secretKey;
  const now = new Date(); // Obtém o horário atual do computador
  const timeStep = 30; // Intervalo de 30 segundos
  const epoch = Math.floor(now.getTime() / 1000);
  const counter = Math.floor(epoch / timeStep);

  const keyHex = base32ToHex(secretKey.replace(/ /g, ""));
  const counterHex = counter.toString(16).padStart(16, "0");

  const hmac = await generateHMAC(keyHex, counterHex);
  const hmacArray = new Uint8Array(hmac);

  const offset = hmacArray[hmacArray.length - 1] & 0xf;
  const binary =
    ((hmacArray[offset] & 0x7f) << 24) |
    ((hmacArray[offset + 1] & 0xff) << 16) |
    ((hmacArray[offset + 2] & 0xff) << 8) |
    (hmacArray[offset + 3] & 0xff);

  const totp = (binary % 1000000).toString().padStart(6, "0");

  return totp;
}

// Função para gerar o TOTP para todos os usuários e exibir os códigos
async function generateAllTOTPs() {
  const authListContainer = document.getElementById("authList");
  
  // Limpar a lista atual
  authListContainer.innerHTML = "";

  // Para cada usuário na lista, gerar o TOTP e atualizar a interface
  for (const user of authDataList) {
    const totp = await generateTOTPForUser(user);

    const listItem = document.createElement("div");
    listItem.innerHTML = `
      <strong>Nome:</strong> ${user.userName} <br>
      <strong>Número de OAB:</strong> ${user.oabNumber} <br>
      <strong>Código TOTP:</strong> ${totp}
    `;
    authListContainer.appendChild(listItem);
  }
}

// Função para atualizar o relógio
function updateClock() {
  const clockElement = document.getElementById("clock");
  const dateElement = document.getElementById("date");
  const now = new Date();

  // Exibe o tempo no formato de hora e minuto
  clockElement.textContent = now.toLocaleTimeString();
  dateElement.textContent = now.toLocaleDateString();
}

// Função para atualizar o temporizador
function updateTimer() {
  const timerElement = document.getElementById("timer");
  const timeStep = 30;
  const now = new Date();
  const secondsRemaining = timeStep - (now.getSeconds() % timeStep);

  // Exibe a contagem regressiva
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Atualiza os TOTPs a cada 30 segundos
setInterval(generateAllTOTPs, 30000);

// Atualiza o relógio e o timer a cada segundo
setInterval(() => {
  updateClock();
  updateTimer();
}, 1000);

// Carregar a página com os TOTPs
window.onload = function () {
  generateAllTOTPs(); // Gera todos os TOTPs para os usuários
  
  updateTimer(); // Atualiza o temporizador
};

function updateTimer() {
  const timerElement = document.getElementById("timer");
  const timeStep = 30; // Intervalo de 30 segundos
  const now = new Date();
  const secondsElapsed = now.getSeconds(); // Segundos já passados no minuto
  const secondsRemaining = timeStep - (secondsElapsed % timeStep); // Segundos restantes no ciclo de 30s

  // Exibe a contagem regressiva
  timerElement.textContent = `${String(secondsRemaining).padStart(2, '0')}s`;

  // Se atingir zero, recarregue a página
  if (secondsRemaining === 30) {
    location.reload(); // Recarrega a página para atualizar tudo
  }
}

// Atualiza o timer a cada segundo
setInterval(updateTimer, 1000);