use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

declare_id!("5K2gp4RCR7xRY9syXYsX5zwkdnK6UWpdmtSFVJiSTAZy");

#[program]
pub mod enigma_bound {
    use super::*;

    pub fn start_new_level(
        ctx: Context<CreateGame>,
        level: u8,
        hidden_word: String,
        riddle_prompt: String,
        riddle_answer: String,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game_state;
        game.player = *ctx.accounts.payer.key;
        game.level = level;
        game.hidden_word = hidden_word.to_uppercase();
        game.riddle = riddle_prompt;
        game.riddle_answer_hash = keccak::hash(riddle_answer.to_uppercase().as_bytes()).to_bytes();

        // Ajuste de dificultad por nivel
        game.lives = if level > 5 { 4 } else { 6 };
        game.game_status = GameStatus::Active;

        let mut mask = String::new();
        for _ in 0..game.hidden_word.len() {
            mask.push('_');
        }
        game.revealed_mask = mask;

        emit!(GameStarted {
            player: game.player,
            level: game.level,
            riddle: game.riddle.clone()
        });

        Ok(())
    }

    pub fn guess_letter(ctx: Context<Action>, letter: String) -> Result<()> {
        let game = &mut ctx.accounts.game_state;
        require!(
            game.game_status == GameStatus::Active,
            GameError::GameFinished
        );

        let guess = letter.to_uppercase().chars().next().unwrap();
        let mut found = false;
        let mut new_mask = String::new();
        let current_mask = game.revealed_mask.clone();

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
            if game.revealed_mask == game.hidden_word {
                game.game_status = GameStatus::Won;
            }
        } else {
            game.lives -= 1;
            if game.lives == 0 {
                game.game_status = GameStatus::Lost;
            }
            // Evento de fallo para motivación del cliente
            emit!(PlayerFailed {
                player: game.player,
                lives_left: game.lives,
                is_critical: game.lives <= 2
            });
        }
        Ok(())
    }

    pub fn solve_riddle(ctx: Context<Action>, submission: String) -> Result<()> {
        let game = &mut ctx.accounts.game_state;
        let submission_hash = keccak::hash(submission.to_uppercase().as_bytes()).to_bytes();

        if submission_hash == game.riddle_answer_hash {
            game.game_status = GameStatus::Won;
            game.revealed_mask = game.hidden_word.clone();
        } else {
            game.lives = if game.lives > 2 { game.lives - 2 } else { 0 };
            if game.lives == 0 {
                game.game_status = GameStatus::Lost;
            }
            emit!(PlayerFailed {
                player: game.player,
                lives_left: game.lives,
                is_critical: true
            });
        }
        Ok(())
    }
}

#[account]
pub struct GameState {
    pub player: Pubkey,
    pub level: u8,
    pub hidden_word: String,
    pub riddle: String,
    pub riddle_answer_hash: [u8; 32],
    pub revealed_mask: String,
    pub lives: u8,
    pub game_status: GameStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Active,
    Won,
    Lost,
}

#[event]
pub struct GameStarted {
    pub player: Pubkey,
    pub level: u8,
    pub riddle: String,
}

#[event]
pub struct PlayerFailed {
    pub player: Pubkey,
    pub lives_left: u8,
    pub is_critical: bool,
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        init_if_needed, 
        payer = payer, 
        space = 8 + 32 + 1 + 64 + 200 + 32 + 64 + 1 + 1, 
        seeds = [b"enigma", payer.key().as_ref()], 
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Action<'info> {
    #[account(mut, seeds = [b"enigma", payer.key().as_ref()], bump)]
    pub game_state: Account<'info, GameState>,
    pub payer: Signer<'info>,
}

#[error_code]
pub enum GameError {
    #[msg("El juego ya ha terminado.")]
    GameFinished,
}
