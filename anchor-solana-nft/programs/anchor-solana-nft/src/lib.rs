use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
        CreateMasterEditionV3, CreateMetadataAccountsV3, Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::pda::{find_master_edition_account, find_metadata_account};

declare_id!("EKcavhoQbsx3GCZuEyA5mbLsCMpVmniNvMqg6KEkcNoQ");

#[program]
pub mod solana_nft_anchor {
    use super::*;

    pub fn init_nft(
        ctx: Context<InitNFT>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        /*
        This is a structured way to bundle all the accounts we’ll interact with when making a cross-program invocation (CPI),
        thus simplifying the process. It also has already defined methods for commonly called instructions.
        */
        // create mint account
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.associated_token_account.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );

        mint_to(cpi_context, 1)?;

        // Create metadata account
        let cpi_context = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.signer.to_account_info(),
                update_authority: ctx.accounts.signer.to_account_info(),
                payer: ctx.accounts.signer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );

        let data_v2 = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        create_metadata_accounts_v3(cpi_context, data_v2, false, true, None)?;

        //create master edition account
        let cpi_context = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.signer.to_account_info(),
                mint_authority: ctx.accounts.signer.to_account_info(),
                payer: ctx.accounts.signer.to_account_info(),
                metadata: ctx.accounts.metadata_account.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );

        create_master_edition_v3(cpi_context, None)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitNFT<'info> {
    // We are marking the account as mutable
    /// CHECK: ok , we are passing in this account ourselves
    #[account(mut, signer)] // This is an Anchor Constraint
    pub signer: AccountInfo<'info>,
    /*
    AccountInfo type is a way to define accounts that do not implement any checks on the account being passed.
    We are blindly trusting the account being passed as the correct account without verifying the structure of
    the data or the owner of the account.
    */
    /*
    Constraints below explained
    - init: like a wrapper around system_instruction::create_account() functions which
            instructs the System Program to create the account.
            Initializing involves three key steps:

            1. Allocating Space: Assigning the necessary storage space for the account.
            2. Transferring Lamports for Rent: Paying the necessary fees to rent the space.
            3. Assigning the Account: Linking the account to the appropriate owning program.

    - payer: signer which is used to pay the rent for the account creation.
             What is rent? For you to store data on Solana, you must pay a sort of deposit.
            This incentivizes the validators to store your data. If not paid, your data will
            be pruned from the blockchain.

    - mint::decimals:  sets the decimals of our NFT token. You can’t have a 0.25 NFT!.
    - mint::authority: Address allowed to mint more tokens. For our NFT, this field is going to be set to zero.
                       No one is allowed to mint more tokens.
    - mint::freeze_authority:  Address allowed to freeze the token account.
    */
    #[account(
        init,
        payer = signer,
        mint::decimals = 0,
        mint::authority = signer.key(),
        mint::freeze_authority = signer.key(),
    )]
    pub mint: Account<'info, Mint>,
    // NOTE: mint account doesn't hold any tokens. Token Account is for that.
    /*
    Account account type is a more secure way of declaring your accounts. It contains all the methods of AccountInfo,
    but it verifies program ownership and deserializes underlying data into the specified type. In our above, Account
    checks that the owner of our mint is indeed the Token program and the account contains all the required fields for a Mint account.
    */
    //The Associated Token Account is a PDA that is deterministically derived using the address and mint account
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
    )]
    pub associated_token_account: Account<'info, TokenAccount>,

    /// CHECK: address
    #[account(
            mut,
            address=find_metadata_account(&mint.key()).0,
        )]
    pub metadata_account: AccountInfo<'info>,
    /// CHECK: address
    #[account(
        mut,
        address=find_master_edition_account(&mint.key()).0,
    )]
    pub master_edition_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>, // handles creation of our ATA(Associated Token Account).
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>, // because the associated token program might end up needing to create a new ATA, we need to pass in this program which is responsible for creating all accounts.
    pub rent: Sysvar<'info, Rent>, // on Solana, you need to pay for space when you are storing data on the blockchain.
}
