pub use anchor_lang::prelude::*;

use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::states::{ActiveLoan, CollectionPool, Offer, Vault};

use crate::errors::ErrorCodes;

#[derive(Accounts)]
pub struct Borrow<'info> {
    #[account(
        init,
        seeds = [b"active-loan", offer_loan.key().as_ref()],
        bump,
        payer = borrower,
        space = ActiveLoan::LEN
    )]
    pub active_loan: Box<Account<'info, ActiveLoan>>,

    #[account(mut)]
    pub offer_loan: Box<Account<'info, Offer>>,

    #[account(mut)]
    pub vault_account: Account<'info, Vault>,

    /// a TokenAccount and will hold the NFT
    #[account(
        init,
        seeds = [
            b"vault-asset-account",
            offer_loan.key().as_ref(),
        ],
        bump,
        payer = borrower,
        token::mint = asset_mint,
        token::authority = vault_authority
    )]
    pub vault_asset_account: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous
    #[account(mut)]
    pub vault_authority: AccountInfo<'info>,

    #[account(mut)]
    pub collection_pool: Box<Account<'info, CollectionPool>>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(
        mut,
        constraint = borrower_asset_account.owner == *borrower.key,
        constraint = borrower_asset_account.mint == *asset_mint.to_account_info().key
    )]
    pub borrower_asset_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub asset_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub clock: Sysvar<'info, Clock>,
}

impl<'info> Borrow<'info> {
    fn transfer_to_vault_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.borrower_asset_account.to_account_info().clone(),
            to: self.vault_asset_account.to_account_info().clone(),
            authority: self.borrower.to_account_info().clone(),
        };

        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

pub fn handler(ctx: Context<Borrow>, minimum_balance_for_rent_exemption: u64) -> Result<()> {
    let active_loan = &mut ctx.accounts.active_loan;
    let offer = &mut ctx.accounts.offer_loan;
    let collection = &mut ctx.accounts.collection_pool;

    if offer.is_loan_taken == true {
        return Err(ErrorCodes::LoanAlreadyTaken.into());
    }

    active_loan.collection = collection.key();
    active_loan.offer_account = offer.key();
    active_loan.lender = offer.lender.key();
    active_loan.borrower = ctx.accounts.borrower.key();
    active_loan.mint = ctx.accounts.asset_mint.key();
    active_loan.loan_ts = ctx.accounts.clock.unix_timestamp;
    active_loan.repay_ts = ctx.accounts.clock.unix_timestamp + collection.duration;
    active_loan.is_repaid = false;
    active_loan.is_liquidated = false;
    active_loan.bump = ctx.bumps.active_loan;

    offer.borrower = ctx.accounts.borrower.key();
    offer.is_loan_taken = true;

    // here that this transfer is invoked from the anchor_spl whereas the transfer we were using before was system_program::transfer()
    // his is because when we have to transfer lamports, we would need to use system program, but if we need to transfer SPL Tokens,
    // which include tokens and NFTs, then we need to use the token program.
    token::transfer(ctx.accounts.transfer_to_vault_context(), 1)?;

    let vault_lamports_initial: u64 = ctx.accounts.vault_account.to_account_info().lamports();

    let transfer_amount = vault_lamports_initial
        .checked_sub(minimum_balance_for_rent_exemption)
        .unwrap();

    **ctx
        .accounts
        .vault_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= transfer_amount;
    **ctx.accounts.borrower.try_borrow_mut_lamports()? += transfer_amount;

    Ok(())
}
