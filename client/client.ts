import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EnigmaBound } from "./target/types/enigma_bound";

// --- CONFIGURACIÓN DE COLORES (Tu estilo original) ---
const C = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m"
};

const BANNER = `
${C.cyan}${C.bright}
  ██████╗███╗   ██╗██╗ ██████╗ ███╗   ███╗ █████╗ 
  ██╔═══╝████╗  ██║██║██╔════╝ ████╗ ████║██╔══██╗
  █████╗  ██╔██╗ ██║██║██║   ███╗██╔████╔██║███████║
  ██╔══╝  ██║╚██╗██║██║██║   ██║██║╚██╔╝██║██╔══██║
  ██████╗██║ ╚████║██║╚██████╔╝██║ ╚═╝ ██║██║  ██║
  ╚═════╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
              --- B O U N D ---
${C.reset}`;

const HANGMAN_PICS = [
  `  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========`,
  `  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========`,
  `  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========`,
  `  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========`,
  `  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========`,
  `  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========`,
  `  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========`
];

const MOTIVATION = [
  "¡No te rindas! Los grandes desarrolladores fallan mil veces.",
  "¡Casi lo tienes! El monito confía en tu inteligencia.",
  "¡Un error es solo un paso más hacia la victoria!",
  "¡Venga equipo! La blockchain registra tu esfuerzo.",
  "¡Fuerza! Estás a un paso de resolver el misterio."
];

const CRITICAL = [
  "¡CUIDADO! La horca está cerca. ¡Usa el acertijo!",
  "¡Últimas oportunidades! Piensa con claridad...",
  "¡No entres en pánico! El éxito está a un clic."
];

// --- BASE DE DATOS DE NIVELES EXTENDIDA ---
const DATABASE_NIVELES = [
  { word: "SOLANA", q: "Red rápida como la luz, con S comienza.", a: "SOLANA" },
  { word: "BLOCKCHAIN", q: "Cadena de bloques inmutable.", a: "BLOCKCHAIN" },
  { word: "ANCHOR", q: "Framework esencial para Rust en Solana.", a: "ANCHOR" },
  { word: "BITCOIN", q: "La madre de todas las criptos.", a: "BITCOIN" },
  { word: "PHANTOM", q: "Tu billetera favorita con icono de fantasma.", a: "PHANTOM" },
  { word: "RUST", q: "Lenguaje de programación seguro y veloz.", a: "RUST" },
  { word: "VALIDADOR", q: "Nodo que asegura la red Solana.", a: "VALIDADOR" },
  { word: "TOKEN", q: "Activo digital que vive en la cadena.", a: "TOKEN" },
  { word: "METAPLEX", q: "El estándar para los NFTs en Solana.", "a": "METAPLEX" },
  { word: "SATS", q: "La unidad más pequeña de un Bitcoin.", "a": "SATS" },
  { word: "MAINNET", q: "Donde vive el dinero real en la red.", "a": "MAINNET" },
  { word: "DEVNET", q: "Paraíso de pruebas para desarrolladores.", "a": "DEVNET" },
  { word: "CANDYMACHINE", q: "Protocolo para mintear colecciones NFT.", "a": "CANDYMACHINE" },
  { word: "SMARTCONTRACT", q: "Código que se ejecuta solo en la red.", "a": "SMARTCONTRACT" },
  { word: "LAMPORT", q: "La unidad mínima de medida en SOL.", "a": "LAMPORT" },
  { word: "GENESIS", q: "El primer bloque de una blockchain.", "a": "GENESIS" },
  { word: "HACKATHON", q: "Evento donde nacen las mejores dApps.", "a": "HACKATHON" },
  { word: "AIRDROP", q: "Regalo de tokens directo a tu wallet.", "a": "AIRDROP" },
  { word: "STAKING", q: "Bloquear tus monedas para ganar recompensas.", "a": "STAKING" },
  { word: "FUNGIBLE", q: "Algo que se puede intercambiar por otro igual.", "a": "FUNGIBLE" }
];

// Función para mezclar los niveles (Shuffle)
function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function playPro() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.EnigmaBound as Program<EnigmaBound>;
  const provider = anchor.getProvider();

  console.log(BANNER);

  // Escuchar eventos de motivación en tiempo real
  program.addEventListener("PlayerFailed", (event) => {
    const list = event.isCritical ? CRITICAL : MOTIVATION;
    const phrase = list[Math.floor(Math.random() * list.length)];
    console.log(`\n${C.magenta}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
    console.log(`┃ ${C.white}💬 MENSAJE DE APOYO:                       ${C.magenta} ┃`);
    console.log(`┃ ${C.yellow}"${phrase.padEnd(42)}"${C.magenta} ┃`);
    console.log(`┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${C.reset}`);
  });

  const [gamePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("enigma"), provider.publicKey.toBuffer()],
    program.programId
  );

  // MEZCLAR NIVELES AL EMPEZAR
  const nivelesMezclados = shuffle([...DATABASE_NIVELES]);
  console.log(`${C.cyan}>> ¡Preparando ${nivelesMezclados.length} niveles aleatorios para ti!${C.reset}\n`);

  for (let i = 0; i < nivelesMezclados.length; i++) {
    const current = nivelesMezclados[i];
    const levelDisplay = i + 1;

    console.log(`${C.bgBlue}${C.white}  FASE ${levelDisplay} DE ${nivelesMezclados.length}  ${C.reset}`);
    
    try {
      // Iniciar nuevo nivel en la blockchain
      process.stdout.write(`${C.cyan}>> Sincronizando nivel ${levelDisplay} con Solana...${C.reset}`);
      await program.methods.startNewLevel(levelDisplay, current.word, current.q, current.a).rpc();
      console.log(` ${C.green}[LISTO]${C.reset}\n`);

      let state = await program.account.gameState.fetch(gamePda);
      renderDashboard(state);

      // --- AQUÍ EMPIEZA LA LÓGICA DE JUEGO POR NIVEL ---
      // (En este ejemplo simulamos que el jugador resuelve el acertijo)
      console.log(`${C.yellow}>> Pensando en el acertijo...${C.reset}`);
      await new Promise(r => setTimeout(r, 1500)); // Pequeña pausa dramática

      // Resolvemos el acertijo
      await program.methods.solveRiddle(current.a).rpc();
      state = await program.account.gameState.fetch(gamePda);
      renderDashboard(state);

      if (JSON.stringify(state.gameStatus).includes("Won")) {
        console.log(`${C.green}${C.bright}✨ ¡NIVEL ${levelDisplay} SUPERADO! ✨${C.reset}\n`);
      } else {
        console.log(`${C.red}☠ Has perdido en el nivel ${levelDisplay}. ¡El juego ha terminado!${C.reset}`);
        return; 
      }

    } catch (err) {
      console.log(`\n${C.red}❌ Error en nivel ${levelDisplay}: ${err}${C.reset}`);
      break;
    }
  }

  console.log(`\n${C.green}${C.bright}🏆 ¡VICTORIA TOTAL, JONATHAN! 🏆${C.reset}`);
  console.log(`${C.cyan}Has completado todos los enigmas de la blockchain.${C.reset}\n`);
}

function renderDashboard(state: any) {
  const hangmanIdx = Math.max(0, Math.min(6, 6 - state.lives));
  const statusColor = JSON.stringify(state.gameStatus).includes("Active") ? C.cyan : (JSON.stringify(state.gameStatus).includes("Won") ? C.green : C.red);

  console.log(`${C.blue}╔════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.blue}║${C.white}  ${C.bright}DASHBOARD DEL JUEGO${C.reset}           ${C.blue}║${C.reset}`);
  console.log(`${C.blue}╠════════════════════════════════════════════╣${C.reset}`);
  console.log(`${C.yellow}${HANGMAN_PICS[hangmanIdx].split('\n').map(l => `║  ${l.padEnd(40)}║`).join('\n')}${C.reset}`);
  console.log(`${C.blue}╠════════════════════════════════════════════╣${C.reset}`);
  console.log(`${C.blue}║${C.cyan}  NIVEL:${C.reset} ${state.level.toString().padEnd(33)} ${C.blue}║${C.reset}`);
  console.log(`${C.blue}║${C.cyan}  ENIGMA:${C.reset} ${state.riddle.substring(0, 32).padEnd(32)} ${C.blue}║${C.reset}`);
  console.log(`${C.blue}║${C.cyan}  PALABRA:${C.reset} ${C.bright}${state.revealedMask.split('').join(' ').padEnd(31)}${C.reset}${C.blue}║${C.reset}`);
  console.log(`${C.blue}║${C.cyan}  VIDAS:${C.reset} ${"❤️ ".repeat(state.lives).padEnd(34)} ${C.blue}║${C.reset}`);
  console.log(`${C.blue}║${C.cyan}  ESTADO:${C.reset} ${statusColor}${JSON.stringify(state.gameStatus).toUpperCase().padEnd(32)}${C.blue}${C.reset} ║`);
  console.log(`${C.blue}╚════════════════════════════════════════════╝${C.reset}\n`);
}

playPro();
