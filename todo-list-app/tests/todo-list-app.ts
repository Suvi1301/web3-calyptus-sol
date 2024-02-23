import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TodoListApp } from "../target/types/todo_list_app";
import { assert } from "chai";


describe("todo-list-app", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.TodoListApp as Program<TodoListApp>;
  const author = program.provider as anchor.AnchorProvider;
  it("can create a task", async () => {
    const task = anchor.web3.Keypair.generate();
    const tx = await program.methods
      .addTask("My first test task!")
      .accounts({
        task: task.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([task])
      .rpc();
    console.log("Your transaction signature", tx);


    const taskAccount = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount);


    assert.equal(
      taskAccount.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount.description, "My first test task!");
    assert.equal(taskAccount.isCompleted, false);
    assert.ok(taskAccount.createdAt);
    assert.ok(taskAccount.updatedAt);
  });

  it("can update a task", async () => {
    const task = anchor.web3.Keypair.generate();
    const tx_add = await program.methods
      .addTask("Task to Update!")
      .accounts({
        task: task.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([task])
      .rpc();
    console.log("Your transaction signature", tx_add);


    const taskAccount = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount);


    assert.equal(
      taskAccount.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount.description, "Task to Update!");
    assert.equal(taskAccount.isCompleted, false);
    assert.ok(taskAccount.createdAt);
    assert.ok(taskAccount.updatedAt);


    const tx_update = await program.methods
      .updateTask(true)
      .accounts({
        task: task.publicKey,
      })
      .rpc();
    console.log("Your update transaction signature", tx_update);

    const updatedTaskAccount = await program.account.task.fetch(task.publicKey);
    console.log("Your task", updatedTaskAccount);


    assert.equal(
      updatedTaskAccount.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(updatedTaskAccount.description, "Task to Update!");
    assert.equal(updatedTaskAccount.isCompleted, true);
    assert.ok(updatedTaskAccount.createdAt);
    assert.ok(updatedTaskAccount.updatedAt);
  });

  it("can delete a task", async () => {
    const task = anchor.web3.Keypair.generate();
    const tx_add = await program.methods
      .addTask("Task to Delete!")
      .accounts({
        task: task.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([task])
      .rpc();
    console.log("Your transaction signature", tx_add);


    const taskAccount = await program.account.task.fetch(task.publicKey);
    console.log("Your task", taskAccount);


    assert.equal(
      taskAccount.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(taskAccount.description, "Task to Delete!");
    assert.equal(taskAccount.isCompleted, false);
    assert.ok(taskAccount.createdAt);
    assert.ok(taskAccount.updatedAt);

    const tx_delete = await program.methods
      .deleteTask()
      .accounts({
        task: task.publicKey,
      })
      .rpc();
    console.log("Your update transaction signature", tx_delete);

    const deletedTaskAccount = await program.account.task.fetch(task.publicKey);
    console.log("Your task", deletedTaskAccount);


    assert.equal(
      deletedTaskAccount.author.toBase58(),
      author.wallet.publicKey.toBase58()
    );
    assert.equal(deletedTaskAccount.description, "Task to Delete!");
    assert.equal(deletedTaskAccount.isCompleted, true);
    assert.ok(deletedTaskAccount.createdAt);
    assert.ok(deletedTaskAccount.updatedAt);
  });
});
