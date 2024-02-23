use anchor_lang::prelude::*;

declare_id!("BbRjfZLZiQtRLK8cfWYf8QEn1Mz6suspyJfxikw5xQmm");

#[program]
pub mod todo_list_app {
    use super::*;

    pub fn initialize(ctx: Context<AddTask>) -> Result<()> {
        Ok(())
    }

    const DISCRIMINATOR: usize = 8;
    const PUBLIC_KEY_LENGTH: usize = 32;
    const BOOL_LENGTH: usize = 1;
    const TEXT_LENGTH: usize = 4 + 400 * 4; // 400 chars
    const TIMESTAMP_LENGTH: usize = 8;

    #[account]
    pub struct Task {
        pub author: Pubkey,
        pub is_completed: bool,
        pub description: String,
        pub created_at: i64,
        pub updated_at: i64,
    }

    impl Task {
        /*
        8 additional bytes in the `LEN` constant. These 8 bytes, also known as discriminator,
        are required by Anchor to distinguish between two or more structs. Anchor takes the
        human readable name of the struct (‘Task’ in our case), generates SHA-256 hash of the
        string and saves the first 8 bytes of the resulting hash in the account.
         */
        const LEN: usize = DISCRIMINATOR + // discriminator
            PUBLIC_KEY_LENGTH + // author
            BOOL_LENGTH + // is_completed
            TEXT_LENGTH + // description
            TIMESTAMP_LENGTH + // created_at
            TIMESTAMP_LENGTH; // updated_at
    }

    /*
                    #[derive(Accounts)]
    This is a procedural macro provided by the Anchor framework.
    It automatically generates the necessary code to handle the accounts
    for the specified program instruction. It simplifies and automates
    the process of managing accounts in Solana smart contracts.
    */
    #[derive(Accounts)]
    pub struct AddTask<'info> {
        #[account(init, payer = author, space = Task::LEN)]
        pub task: Account<'info, Task>,

        // mutable as we will be changing the balance of the account of the author when he pays.
        #[account(mut)]
        pub author: Signer<'info>,
        /*
        This is the official System program from Solana. As programs are stateless,
        we even need to pass through the official System Program. This program will
        be used to initialise the Task account.
        */
        pub system_program: Program<'info, System>,
    }

    pub fn add_task(ctx: Context<AddTask>, description: String) -> Result<()> {
        /*
        ctx: The Context contains essential information about the program’s execution context,
             including accounts, program IDs, and more. In this case, it holds references to the
             accounts involved in the transaction, such as the task being added and the author’s account.
        description: a string representing the content of the new task that the user wants to add.
        */

        // creates a mutable reference to the task account.
        // As accounts are immutable by default, we need to modify the fields of the task to add new information
        // like the task author etc/
        let task = &mut ctx.accounts.task;

        // creates an immutable reference to the author account.
        // This account represents the person who is adding the new task to the to-do list
        let author = &ctx.accounts.author;

        let clock = Clock::get().unwrap(); // Getting the current timestamp
        if description.chars().count() > 400 {
            return Err(ErrorCode::TextTooLong.into());
        }
        task.author = *author.key;
        task.is_completed = false;
        task.created_at = clock.unix_timestamp;
        task.updated_at = clock.unix_timestamp;
        task.description = description;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct UpdateTask<'info> {
        #[account(mut, has_one = author)]
        pub task: Account<'info, Task>,
        pub author: Signer<'info>,
    }

    pub fn update_task(ctx: Context<UpdateTask>, is_completed: bool) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let author = &ctx.accounts.author;
        let clock = Clock::get().unwrap();
        task.author = *author.key;
        task.is_completed = is_completed;
        task.updated_at = clock.unix_timestamp;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct DeleteTask<'info> {
        #[account(mut, has_one = author)]
        pub task: Account<'info, Task>,
        pub author: Signer<'info>,
    }

    pub fn delete_task(ctx: Context<DeleteTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let author = &ctx.accounts.author;
        let clock = Clock::get().unwrap();
        task.author = *author.key;
        task.is_completed = true;
        task.updated_at = clock.unix_timestamp;
        Ok(())
    }

    #[error_code]
    pub enum ErrorCode {
        #[msg("The text is too long")]
        TextTooLong,
    }
}
