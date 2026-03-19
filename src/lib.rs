use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak; // Necesario para hashear el acertijo

declare_id!("5K2gp4RCR7xRY9syXYsX5zwkdnK6UWpdmtSFVJiSTAZy");

#[program]
pub mod enigma_bound {
    use super::*;

    // 1. INICIALIZAR EL JUEGO: Crea una PDA para guardar el estado
    pub fn create_game(
        ctx: Context<CreateGame>,
        hidden_word: String,
        riddle_prompt: String,
        riddle_answer: String,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game_state;
        game.player = *ctx.accounts.payer.key;
        game.hidden_word = hidden_word.to_uppercase();
        game.riddle = riddle_prompt;
        
        // Guardamos solo el HASH de la respuesta del acertijo.
        // ¡Así nadie puede hacer trampa viendo los datos de la cuenta!
        game.riddle_answer_hash = keccak::hash(riddle_answer.to_uppercase().as_bytes()).to_bytes();
        game.lives = 6; // Dibujo completo del monito (cabeza, cuerpo, 2 brazos, 2 piernas)
        game.game_status = GameStatus::Active;

        // Inicializar la máscara revelada (_____)
        let mut mask = String::new();
        for _ in 0..game.hidden_word.len() {
            mask.push('_');
        }
        game.revealed_mask = mask;

        msg!("¡Juego Creado! Palabra de {} letras.", game.hidden_word.len());
        msg!("Enigma: {}", game.riddle);
        Ok(())
    }

    // 2. ADIVINAR UNA LETRA: El método tradicional
    pub fn guess_letter(ctx: Context<GuessLetter>, letter_guess: String) -> Result<()> {
        let game = &mut ctx.accounts.game_state;
        require!(game.game_status == GameStatus::Active, GameError::GameFinished);
        require!(letter_guess.len() == 1, GameError::InvalidInput);

        let guess = letter_guess.to_uppercase().chars().next().unwrap();
        let mut found = false;
        let mut new_mask = String::new();
        let current_mask = game.revealed_mask.clone();

        // Verificar la letra contra la palabra oculta
        for (i, c) in game.hidden_word.chars().enumerate() {
            if c == guess {
                new_mask.push(guess);
                found = true;
            } else {
                new_mask.push(current_mask.chars().nth(i).unwrap());
            }
        }

        if found {
            game.revealed_mask = new_mask;
            msg!("¡Bien! Letra '{}' encontrada.", guess);
            
            // Verificar si el jugador ya ganó
            if game.revealed_mask == game.hidden_word {
                game.game_status = GameStatus::Won;
                msg!("¡FELICIDADES! Resolviste el Enigma.");
            }
        } else {
            // El monito se acerca a la horca
            game.lives -= 1;
            msg!("Letra '{}' incorrecta. Te quedan {} vidas.", guess, game.lives);
            if game.lives == 0 {
                game.game_status = GameStatus::Lost;
                msg!("BOOM. Monito ahorcado. La palabra era: {}", game.hidden_word);
            }
        }
        Ok(())
    }

    // 3. RESOLVER EL ACERTIJO: El giro divertido
    // Si resuelves el acertijo, revela TODAS las letras de la respuesta
    // que estén en la palabra oculta sin gastar vidas.
    pub fn solve_riddle(ctx: Context<SolveRiddle>, riddle_submission: String) -> Result<()> {
        let game = &mut ctx.accounts.game_state;
        require!(game.game_status == GameStatus::Active, GameError::GameFinished);

        let submission_upper = riddle_submission.to_uppercase();
        let submission_hash = keccak::hash(submission_upper.as_bytes()).to_bytes();

        if submission_hash == game.riddle_answer_hash {
            msg!("¡Increíble! Acertijo resuelto. Revelando letras...");
            
            let mut new_mask = String::new();
            let current_mask = game.revealed_mask.clone();

            // Lógica de revelado mágico: Cualquier letra en la respuesta del acertijo
            // que también esté en la palabra oculta se revela automáticamente.
            for (i, c) in game.hidden_word.chars().enumerate() {
                if submission_upper.contains(c) {
                    new_mask.push(c);
                } else {
                    new_mask.push(current_mask.chars().nth(i).unwrap());
                }
            }
            
            game.revealed_mask = new_mask;

            // Verificar win condition
            if game.revealed_mask == game.hidden_word {
                game.game_status = GameStatus::Won;
                msg!("¡FELICIDADES! Resolviste el Enigma mediante el acertijo.");
            }
        } else {
            // Un castigo justo por fallar el acertijo
            game.lives = if game.lives > 2 { game.lives - 2 } else { 0 };
            msg!("Acertijo incorrecto. La horca se acerca rápido. Vidas restantes: {}", game.lives);
            if game.lives == 0 {
                game.game_status = GameStatus::Lost;
                msg!("El monito fue ahorcado intentando resolver el acertijo.");
            }
        }
        Ok(())
    }
}

// ESTRUCTURAS DE DATOS ON-CHAIN

#[account]
pub struct GameState {
    pub player: Pubkey,         // 32
    pub hidden_word: String,   // ~36 (4 para len + 32 chars max)
    pub riddle: String,        // ~104 (4 para len + 100 chars max)
    pub riddle_answer_hash: [u8; 32], // 32
    pub revealed_mask: String, // ~36 (4 para len + 32 chars max)
    pub lives: u8,             // 1
    pub game_status: GameStatus, // 1 (Enum)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Active,
    Won,
    Lost,
}

// CONTEXTOS DE INSTRUCCIONES (Cuentas necesarias)

#[derive(Accounts)]
pub struct CreateGame<'info> {
    // Usamos una PDA derivada de 'payer' para que cada cuenta de juego sea única.
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 36 + 104 + 32 + 36 + 1 + 1, // Espacio calculado
        seeds = [b"enigma_game", payer.key().as_ref()],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GuessLetter<'info> {
    #[account(mut, seeds = [b"enigma_game", payer.key().as_ref()], bump)]
    pub game_state: Account<'info, GameState>,
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SolveRiddle<'info> {
    #[account(mut, seeds = [b"enigma_game", payer.key().as_ref()], bump)]
    pub game_state: Account<'info, GameState>,
    pub payer: Signer<'info>,
}

// ERRORES PERSONALIZADOS

#[error_code]
pub enum GameError {
    #[msg("El juego ha terminado.")]
    GameFinished,
    #[msg("Entrada inválida. Se espera una sola letra.")]
    InvalidInput,
}
