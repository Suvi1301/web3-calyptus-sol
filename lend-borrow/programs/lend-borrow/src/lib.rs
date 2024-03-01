pub mod instructions;
pub mod states;
use anchor_lang::prelude::*;
pub use instructions::*;
pub use states::*;

declare_id!("bpuPFSHXB4e8CAy1akbNH64XmBdBfzFH977x18Jng6f");

#[program]
pub mod lend_borrow {
    use super::*;

    pub fn create_pool(
        ctx: Context<CreatePool>,
        collection_id: Pubkey,
        duration: i64,
    ) -> Result<()> {
        instructions::create_pool::handler(ctx, collection_id, duration)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
