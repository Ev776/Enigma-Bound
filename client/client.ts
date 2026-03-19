import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.rs";
import type { EnigmaBound } from "./target/types/enigma_bound"; // Asegúrate de dar Build primero

async function playEnigma() {
  // Configurar el cliente y cargar el programa
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.EnigmaBound as anchor.Program<EnigmaBound>;
  const provider = anchor.getProvider();

  // Generar la PDA para nuestro estado de juego
  const [gamePda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("enigma_game"), provider.publicKey.toBuffer()],
    program.programId
  );

  console.log("Comenzando Enigma Bound...");
  console.log("PDA del Juego:", gamePda.toBase58());

  // 1. Crear un juego nuevo
  // Palabra: ORÁCULO. Acertijo: ¿Qué pregunta nunca puedes responder 'sí'? (La respuesta es '¿Estás dormido?')
  try {
    await program.methods
      .createGame(
        "ORACULO", // Palabra oculta
        "¿Qué pregunta nunca puedes responder 'sí'?", // Enigma
        "ESTAS DORMIDO" // Respuesta correcta (Se hasheará on-chain)
      )
      .rpc();
    console.log("✅ ¡Juego creado con éxito on-chain!");
  } catch (e) {
    console.log("Ya existe un juego activo o hubo un error al crear.");
  }

  // Leer estado inicial
  let gameState = await program.account.gameState.fetch(gamePda);
  console.log("--- ESTADO INICIAL ---");
  console.log(` Palabra: ${gameState.revealedMask}`);
  console.log(` Acertijo: ${gameState.riddle}`);
  console.log(` Vidas: ${gameState.lives}`);
  console.log(` Estado: ${JSON.stringify(gameState.gameStatus)}`);

  // 2. Simular adivinanza: Letra 'A' (Debería estar en ORÁCULO)
  console.log("\n--- Adivinando letra 'A' ---");
  await program.methods.guessLetter("a").rpc();
  
  // 3. Simular adivinanza incorrecta: Letra 'Z'
  console.log("\n--- Adivinando letra 'Z' (Incorrecta) ---");
  await program.methods.guessLetter("z").rpc();

  // 4. Intentar resolver el ACERTIJO
  // Esto debería revelar la 'O' y la 'S' si la palabra fuera 'ORACULO'.
  // *Corrección*: Si la respuesta es 'ESTAS DORMIDO', tiene letras S,T,A,D,O,R,M,I.
  // Esas letras que ESTÁN en 'ORACULO' son: O,R,A,D.
  // ¡Se revelarán O, R, A, D de golpe!
  console.log("\n--- ¡Intentando Resolver el Acertijo Mágico! ---");
  try {
    await program.methods.solveRiddle("estas dormido").rpc();
    console.log("✅ ¡Letras reveladas mágicamente por el acertijo!");
  } catch (e) {
    console.log("❌ Fallaste el acertijo.");
  }

  // Leer estado final
  gameState = await program.account.gameState.fetch(gamePda);
  console.log("\n--- ESTADO FINAL ---");
  console.log(` Palabra Revelada: ${gameState.revealedMask}`);
  console.log(` Vidas Restantes: ${gameState.lives}`);
  console.log(` Estado: ${JSON.stringify(gameState.gameStatus)}`);
}

// Ejecutar
playEnigma().then(() => console.log("\nSimulación completada."));
