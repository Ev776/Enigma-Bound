import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EnigmaBound } from "./target/types/enigma_bound";

// --- CONFIGURACIÓN DE COLORES ---
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
  █████╗  ██╔██╗ ██║██║██║  ███╗██╔████╔██║███████║
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

async function playPro() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.EnigmaBound as Program<EnigmaBound>;
  const provider = anchor.getProvider();

  console.log(BANNER);

  // Escuchar eventos de motivación en tiempo real con diseño premium
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

  const riddle = { word: "SOLANA", q: "Red rápida como la luz, con S comienza.", a: "SOLANA" };

  try {
    process.stdout.write(`${C.cyan}>> Conectando con Solana...${C.reset}`);
    await program.methods.startNewLevel(1, riddle.word, riddle.q, riddle.a).rpc();
    console.log(` ${C.green}[OK]${C.reset}\n`);

    let state = await program.account.gameState.fetch(gamePda);
    renderDashboard(state);

    // Simulación de juego
    console.log(`${C.yellow}>> Intentando letra 'X'...${C.reset}`);
    await program.methods.guessLetter("X").rpc();
    state = await program.account.gameState.fetch(gamePda);
    renderDashboard(state);

    console.log(`${C.yellow}>> Intentando letra 'S'...${C.reset}`);
    await program.methods.guessLetter("S").rpc();
    state = await program.account.gameState.fetch(gamePda);
    renderDashboard(state);

    console.log(`${C.green}>> ¡Resolviendo el acertijo final!${C.reset}`);
    await program.methods.solveRiddle(riddle.a).rpc();
    state = await program.account.gameState.fetch(gamePda);
    renderDashboard(state);

    if (JSON.stringify(state.gameStatus).includes("Won")) {
      console.log(`\n${C.green}${C.bright}🏆 ¡VICTORIA ABSOLUTA, JONATHAN! 🏆${C.reset}`);
      console.log(`${C.cyan}Has conquistado el Enigma Bound.${C.reset}\n`);
    }

  } catch (err) {
    console.log(`\n${C.red}❌ Error en la ejecución: ${err}${C.reset}`);
  }
}

function renderDashboard(state: any) {
  const hangmanIdx = 6 - state.lives;
  const statusColor = JSON.stringify(state.gameStatus).includes("Active") ? C.cyan : (JSON.stringify(state.gameStatus).includes("Won") ? C.green : C.red);

  console.log(`${C.blue}╔════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.blue}║${C.white}  ${C.bright}DASHBOARD DEL JUEGO${C.reset}          ${C.blue}║${C.reset}`);
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
