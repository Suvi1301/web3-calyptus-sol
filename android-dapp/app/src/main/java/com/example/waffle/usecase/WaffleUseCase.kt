package com.example.waffle.usecase

import com.solana.networking.serialization.serializers.solana.AnchorInstructionSerializer
import com.solana.core.AccountMeta
import com.solana.core.PublicKey
import com.solana.core.TransactionInstruction
import com.solana.networking.serialization.format.Borsh
import com.solana.programs.SystemProgram
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.withContext
import javax.inject.Inject
import kotlinx.serialization.Serializable

class WaffleUseCase @Inject constructor(private val persistenceUseCase: WalletConnectionUseCase) {

    private suspend fun getWalletConnection(scope: CoroutineScope) : Connected {
        return persistenceUseCase.walletDetails.stateIn(scope).value as Connected
    }

    suspend fun createWaffle() = withContext(Dispatchers.IO) {
        val currConn = getWalletConnection(this)
        val authToken = currConn.authToken
    }

    private fun makeWaffleObject(name: String, user: PublicKey) : TransactionInstruction {
        // Derive the waffle PDA from the name
        val waffleKey = PublicKey.findProgramAddress(
            listOf("waffle".toByteArray(), name.toByteArray()),
            PublicKey("r7t8X1SDve8TRZQwLfJAaDpd5wDvtKuLUejkucAVkvv")
        )

        // Defining all accounts involved in transaction
        val keys = mutableListOf<AccountMeta>()
        keys.add(AccountMeta(waffleKey.address, false, true))
        keys.add(AccountMeta(user, true, true))
        keys.add(AccountMeta(SystemProgram.PROGRAM_ID, false, false))

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