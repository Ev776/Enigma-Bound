import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EnigmaBound } from "./target/types/enigma_bound";

// --- BANCO DE DATOS ENVOLVENTE ---
const RIDDLES = [
  { word: "SOLANA", q: "Soy una red rápida como la luz, mi nombre empieza con S.", a: "SOLANA" },
  { word: "BLOCKCHAIN", q: "Soy una cadena que nadie puede romper, guardo la verdad para siempre.", a: "BLOCKCHAIN" },
  { word: "SATOSHI", q: "Creé el oro digital, pero nadie sabe quién soy realmente.", a: "SATOSHI" },
  { word: "PHANTOM", q: "Soy un fantasma que guarda tus tesoros digitales en tu navegador.", a: "PHANTOM" },
  { word: "NFT", q: "Soy único en mi especie, una obra de arte que vive en el código.", a: "NFT" }
];

const MOTIVATION = [
  "¡No te rindas! Los grandes desarrolladores fallan mil veces antes de tener éxito.",
  "¡Casi lo tienes! Respira profundo y analiza el enigma.",
  "El monito confía en tu inteligencia. ¡Dale otra oportunidad!",
  "¡Un error es solo un paso más hacia la victoria! Intenta con otra letra.",
  "¡Venga equipo! La blockchain registra tu esfuerzo, no solo tus fallos."
];

const CRITICAL_MOTIVATION = [
  "¡CUIDADO! La horca está cerca. Es momento de usar el acertijo.",
  "¡No entres en pánico! Piensa con claridad, el éxito está a un clic.",
  "Últimas oportunidades... ¿Y si pruebas con una vocal?"
];

async function playPro() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.EnigmaBound as Program<EnigmaBound>;
  const provider = anchor.getProvider();

  const [gamePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("enigma"), provider.publicKey.toBuffer()],
    program.programId
  );

  // Escuchar eventos de motivación en tiempo real
  program.addEventListener("PlayerFailed", (event) => {
    const list = event.isCritical ? CRITICAL_MOTIVATION : MOTIVATION;
    const phrase = list[Math.floor(Math.random() * list.length)];
    console.log("\n💬 MENSAJE DEL SISTEMA:");
    console.log(`> "${phrase}"`);
    console.log(`> Vidas restantes: ${event.livesLeft}\n`);
  });

  console.log("--- INICIANDO ENIGMA BOUND: MODO INMERSIVO ---");
  
  // Seleccionar acertijo aleatorio
  const challenge = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];

  try {
    await program.methods
      .startNewLevel(1, challenge.word, challenge.q, challenge.a)
      .rpc();
    
    console.log("🎮 Nivel 1 Iniciado.");
    console.log("ENIGMA:", challenge.q);

    // Simular un fallo para ver la motivación
    console.log("\nIntentando letra incorrecta 'X'...");
    await program.methods.guessLetter("X").rpc();

    // Intentar resolver el acertijo
    console.log("Intentando resolver acertijo...");
    await program.methods.solveRiddle(challenge.a).rpc();

    const state = await program.account.gameState.fetch(gamePda);
    if (JSON.stringify(state.gameStatus).includes("Won")) {
      console.log("⭐ ¡VICTORIA ABSOLUTA! Has superado el Enigma Bound.");
    }

  } catch (err) {
    console.error("Error en la partida:", err);
  }
}

playPro();
