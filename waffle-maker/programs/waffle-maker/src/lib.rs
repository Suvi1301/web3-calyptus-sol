use anchor_lang::prelude::*;

declare_id!("r7t8X1SDve8TRZQwLfJAaDpd5wDvtKuLUejkucAVkvv");

#[program]
pub mod waffle_maker {
    use super::*;

    pub fn create_waffle(ctx: Context<CreateWaffle>, name: String) -> Result<()> {
        require!(name.chars().count() < 30, WaffleError::NameTooLong);
        require!(name.chars().count() > 1, WaffleError::NameEmpty);

        ctx.accounts.waffle.author = ctx.accounts.author.key();
        ctx.accounts.waffle.name = name;

        msg!("Waffle {} created", &ctx.accounts.waffle.name);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateWaffle<'info> {
    #[account(
        init_if_needed,
        payer = author,
        space = Waffle::LEN + name.len(),
        seeds = [b"waffle", name.as_bytes()],
        bump
    )]
    pub waffle: Account<'info, Waffle>,

    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Waffle {
    pub author: Pubkey,
    pub name: String,
}

const DISCRIMINATION_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const STRING_LENGTH_PREFIX: usize = 4;

impl Waffle {
    pub const LEN: usize = DISCRIMINATION_LENGTH + PUBLIC_KEY_LENGTH + STRING_LENGTH_PREFIX;

    pub fn new(author: Pubkey, name: String) -> Self {
        Waffle { author, name }
    }
}

#[error_code]
pub enum WaffleError {
    #[msg("Waffle name can be 30 characters long")]
    NameTooLong,

    #[msg("Waffle name must not be empty")]
    NameEmpty,
}
