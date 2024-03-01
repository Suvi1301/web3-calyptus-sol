use anchor_lang::prelude::*;

#[account]
pub struct CollectionPool {
    /// NFT Collection ID
    pub collection_id: Pubkey,

    /// Pool Owner
    pub pool_owner: Pubkey,

    /// Loan Duration
    pub duration: i64,

    /// Total Loans
    pub total_offers: u64,

    /// Bump
    pub bump: u8,
}

impl CollectionPool {
    /// Number of bytes required to store a Collection pool account
    /// 8 bytes for the Discriminator - for anchor to create a unique id for the account
    /// 32 bytes each for collection id and pool owner (both pubKey types)
    /// 8 bytes each for duration and total offers (i64 and u64)
    /// 1 byte for bump (u8)
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}
