pub use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCodes {
    #[msg("Loan Already Taken")]
    LoanAlreadyTaken,
}
