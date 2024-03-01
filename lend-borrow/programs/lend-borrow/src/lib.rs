pub mod errors;
pub mod instructions;
pub mod states;

pub use errors::ErrorCodes;
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

    pub fn offer_loan(ctx: Context<OfferLoan>, offer_amount: u64) -> Result<()> {
        instructions::offer_loan::handler(ctx, offer_amount)
    }

    pub fn withdraw_offer(
        ctx: Context<WithdrawOffer>,
        minimum_balance_for_rent_exemption: u64,
    ) -> Result<()> {
        instructions::withdraw_offer::handler(ctx, minimum_balance_for_rent_exemption)
    }

    pub fn borrow(ctx: Context<Borrow>, minimum_balance_for_rent_exemption: u64) -> Result<()> {
        instructions::borrow::handler(ctx, minimum_balance_for_rent_exemption)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
