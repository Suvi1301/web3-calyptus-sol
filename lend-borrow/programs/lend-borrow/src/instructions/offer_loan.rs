pub use anchor_lang::prelude::*;

use anchor_lang::system_program;

pub use crate::states::{CollectionPool, Offer, Vault};

#[derive(Accounts)]
pub struct OfferLoan<'info> {
    /// account which keeps track of the offers made to a collection
    #[account(
        init,
        seeds=[
            b"offer",
            collection_pool.key().as_ref(),
            lender.key().as_ref(),
            collection_pool.total_offers.to_string().as_bytes(),
        ],
        bump,
        payer=lender,
        space=Offer::LEN
    )]
    pub offer_loan: Box<Account<'info, Offer>>,

    /// account that will store the vault state, and also all the tokens or NFTs in escrow
    #[account(
        init,
        seeds=[
            b"vault",
            collection_pool.key().as_ref(),
            lender.key().as_ref(),
            collection_pool.total_offers.to_string().as_bytes(),
        ],
        bump,
        payer = lender,
        space = Vault::LEN
    )]
    pub vault_account: Account<'info, Vault>,

    /// collection pool for which the loan is being offered.
    #[account(mut)]
    pub collection_pool: Box<Account<'info, CollectionPool>>,

    /// account which will sign the transaction.
    #[account(mut)]
    pub lender: Signer<'info>,

    /// account to transfer lamports from the lender to the vault.
    pub system_program: Program<'info, System>,
}

impl<'info> OfferLoan<'info> {
    fn transfer_to_vault_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, system_program::Transfer<'info>> {
        let cpi_accounts = system_program::Transfer {
            from: self.lender.to_account_info().clone(),
            to: self.vault_account.to_account_info().clone(),
        };

        CpiContext::new(self.system_program.to_account_info(), cpi_accounts)
    }
}

pub fn handler(ctx: Context<OfferLoan>, offer_amount: u64) -> Result<()> {
    let offer_account = &mut ctx.accounts.offer_loan;
    let collection = &mut ctx.accounts.collection_pool;
    let vault = &mut ctx.accounts.vault_account;

    offer_account.collection = collection.key();
    offer_account.offer_lamport_amount = offer_amount;
    offer_account.repay_lamport_amount = offer_amount + offer_amount * 10 / 100;
    offer_account.lender = ctx.accounts.lender.key();
    offer_account.bump = ctx.bumps.offer_loan;

    collection.total_offers += 1;

    vault.offer = offer_account.key();
    vault.bump = ctx.bumps.vault_account;

    system_program::transfer(ctx.accounts.transfer_to_vault_context(), offer_amount)?;

    Ok(())
}
