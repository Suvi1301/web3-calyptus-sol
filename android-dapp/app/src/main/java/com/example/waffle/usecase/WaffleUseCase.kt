package com.example.waffle.usecase

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.example.waffle.data.getLatestBlockHash
import com.example.waffle.repository.SendTransactionRepository
import com.solana.Solana
import com.solana.networking.serialization.serializers.solana.AnchorInstructionSerializer
import com.solana.core.AccountMeta
import com.solana.core.PublicKey
import com.solana.core.SerializeConfig
import com.solana.core.Transaction
import com.solana.core.TransactionInstruction
import com.solana.mobilewalletadapter.clientlib.ActivityResultSender
import com.solana.mobilewalletadapter.clientlib.MobileWalletAdapter
import com.solana.mobilewalletadapter.clientlib.TransactionResult
import com.solana.networking.serialization.format.Borsh
import com.solana.programs.SystemProgram
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.withContext
import javax.inject.Inject
import kotlinx.serialization.Serializable

class WaffleUseCase @Inject constructor(
    private val walletAdapter: MobileWalletAdapter,
    private val persistenceUseCase: WalletConnectionUseCase,
    private val sendTransactionRepository: SendTransactionRepository,
) {

    private suspend fun getWalletConnection(scope: CoroutineScope) : Connected {
        return persistenceUseCase.walletDetails.stateIn(scope).value as Connected
    }

    @RequiresApi(Build.VERSION_CODES.O) // sendTransactionRepository.confirmTransaction call requires API level 26
    suspend fun createWaffle(
        identityUri: Uri,
        iconUri: Uri,
        identityName: String,
        sender: ActivityResultSender,
        user: PublicKey,
        solana: Solana,
        waffle: String
    ) = withContext(Dispatchers.IO) {
        val currConn = getWalletConnection(this)
        val authToken = currConn.authToken

        // Retrieve latest blockhash
        try {
            val blockHash = solana.api.getLatestBlockHash().getOrThrow()
            val transaction = Transaction()
            transaction.setRecentBlockHash(blockHash)
            transaction.addInstruction(makeWaffleObject(waffle, user))
            transaction.feePayer = user

            // Open the user wallet
            val transferResult = walletAdapter.transact(sender) {
                // Reauthorise the user
                val reAuth = reauthorize(identityUri, iconUri, identityName, authToken)
                persistenceUseCase.persistConnection(
                    reAuth.publicKey,
                    reAuth.accountLabel ?: "",
                    reAuth.authToken
                )
                // Sign this transaction
                val signingResult = signTransactions(
                    arrayOf(
                        transaction.serialize(
                            SerializeConfig(
                                requireAllSignatures = false,
                                verifySignatures = false
                            )
                        )
                    )
                )
                return@transact Transaction.from(signingResult.signedPayloads[0])
            }

            // Send the transaction
            when (transferResult) {
                is TransactionResult.Success -> {
                    try {
                        val transferId =
                            sendTransactionRepository.sendTransaction(transferResult.payload)
                                .getOrThrow()

                        sendTransactionRepository.confirmTransaction(transferId)
                        Log.d(ContentValues.TAG, "https://solana.fm/tx/$transferId?cluster=devnet-solana")
                    } catch (e: Exception) {
                        Log.d(ContentValues.TAG, "Transaction sending failed: ${e.message.toString()}")
                        return@withContext
                    }
                }
                is TransactionResult.Failure -> {
                    return@withContext
                }
                else -> {}
            }

        } catch (e: Exception) {
            Log.d(ContentValues.TAG, "Blockhash fetch failed: ${e.message.toString()}")
            return@withContext
        }
    }

    private fun makeWaffleObject(name: String, user: PublicKey) : TransactionInstruction {
        // Derive the waffle PDA from the name
        val waffleKey = PublicKey.findProgramAddress(
            listOf("waffle".toByteArray(), name.toByteArray()),
            PublicKey("r7t8X1SDve8TRZQwLfJAaDpd5wDvtKuLUejkucAVkvv")
        )

        // Defining all accounts involved in transaction
        val keys = mutableListOf<AccountMeta>()
        keys.add(AccountMeta(waffleKey.address, isSigner = false, isWritable = true))
        keys.add(AccountMeta(user, isSigner = true, isWritable = true))
        keys.add(AccountMeta(SystemProgram.PROGRAM_ID, isSigner = false, isWritable =false))

        return TransactionInstruction(
            PublicKey("r7t8X1SDve8TRZQwLfJAaDpd5wDvtKuLUejkucAVkvv"),
            keys,
            Borsh.encodeToByteArray(
                AnchorInstructionSerializer("create_waffle"),
                Args_createWaffle(name)
            )
        )
    }

    @Serializable
    class Args_createWaffle(val name: String)
}