import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EnigmaBound } from "../target/types/enigma_bound";
import { expect } from "chai";
import * as web3 from "@solana/web3.rs";

describe("enigma-bound-tests", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.EnigmaBound as Program<EnigmaBound>;
  const provider = anchor.getProvider();

  // Derivar la PDA para el test
  const [gamePda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("enigma_game"), provider.publicKey.toBuffer()],
    program.programId
  );

  it("Crea un juego exitosamente con máscara oculta", async () => {
    // Configuración del test
    const hiddenWord = "SOLANA";
    const riddle = "Tengo claves pero no cerraduras.";
    const answer = "TECLADO";

    await program.methods
      .createGame(hiddenWord, riddle, answer)
      .rpc();

    // Validar estado on-chain
    const gameState = await program.account.gameState.fetch(gamePda);
    expect(gameState.player.toBase58()).to.equal(provider.publicKey.toBase58());
    expect(gameState.hiddenWord).to.equal("SOLANA");
    expect(gameState.riddle).to.equal(riddle);
    expect(gameState.lives).to.equal(6);
    expect(gameState.revealedMask).to.equal("______"); // Máscara inicial
    expect(JSON.stringify(gameState.gameStatus)).to.include("Active");
  });

  it("Revela letras correctamente al adivinar una letra", async () => {
    // Adivinar la letra 'A' (Está en SOLANA dos veces)
    await program.methods.guessLetter("a").rpc();

    const gameState = await program.account.gameState.fetch(gamePda);
    expect(gameState.revealedMask).to.equal("___A_A");
    expect(gameState.lives).to.equal(6); // Las vidas no bajaron
  });

  it("Resta vidas correctamente al fallar una letra", async () => {
    // Adivinar la letra 'Z' (No está en SOLANA)
    await program.methods.guessLetter("z").rpc();

    const gameState = await program.account.gameState.fetch(gamePda);
    expect(gameState.revealedMask).to.equal("___A_A"); // Máscara no cambió
    expect(gameState.lives).to.equal(5); // Bajó una vida
  });

  it("Permite resolver el juego completamente adivinando letras", async () => {
    // Adivinar el resto
    await program.methods.guessLetter("s").rpc(); // S__A_A
    await program.methods.guessLetter("o").rpc(); // SO_A_A
    await program.methods.guessLetter("l").rpc(); // SOLA_A
    await program.methods.guessLetter("n").rpc(); // SOLANA

    const gameState = await program.account.gameState.fetch(gamePda);
    expect(gameState.revealedMask).to.equal("SOLANA");
    expect(JSON.stringify(gameState.gameStatus)).to.include("Won"); // ¡Victoria!
  });

  it("Prohibe adivinar letras si el juego ha terminado", async () => {
     try {
        await program.methods.guessLetter("p").rpc();
        expect.fail("Debería haber fallado el test.");
     } catch (e: any) {
        expect(e.message).to.include("GameFinished");
     }
  });
});
