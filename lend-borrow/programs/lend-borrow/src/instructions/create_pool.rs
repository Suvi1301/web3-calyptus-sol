use anchor_lang::prelude::*;

use crate::states::CollectionPool;

/// init: initialise the collection pool account
/// we need only one collection pool to be created per NFT collection,
/// that’s why we add collection_id in the seeds, so that we can link this
/// collection pool account to a particular NFT collection, since a
/// specific combination of seeds will always derive the same program address.
#[derive(Accounts)]
#[instruction(collection_id: Pubkey)]
pub struct CreatePool<'info> {
    #[account(
        init,
        seeds=[b"collection-pool", collection_id.key().as_ref()],
        bump,
        payer=authority, // account responsible to pay rent to store the account on chain
        space=CollectionPool::LEN // amount of bytes required to store the account.
    )]

    /// Use a Box to store data on the heap rather than the stack, else,
    /// we will get a stack overflow error if the amount of data becomes too big.
    pub collection_pool: Box<Account<'info, CollectionPool>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreatePool>, collection_id: Pubkey, duration: i64) -> Result<()> {
    let collection = &mut ctx.accounts.collection_pool;

    collection.collection_id = collection_id;
    collection.pool_owner = ctx.accounts.authority.key();
    collection.duration = duration;
    collection.total_offers = 0;
    collection.bump = ctx.bumps.collection_pool;

    Ok(())
}
