pub mod states;
use anchor_lang::prelude::*;
pub use states::*;

declare_id!("bpuPFSHXB4e8CAy1akbNH64XmBdBfzFH977x18Jng6f");

#[program]
pub mod lend_borrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
