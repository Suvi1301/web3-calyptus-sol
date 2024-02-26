package com.example.waffle.injection

import com.metaplex.lib.drivers.rpc.JdkRpcDriver
import com.metaplex.lib.drivers.solana.Commitment
import com.metaplex.lib.drivers.solana.Connection
import com.metaplex.lib.drivers.solana.TransactionOptions
import com.metaplex.lib.solana.SolanaConnectionDriver
import com.solana.mobilewalletadapter.clientlib.MobileWalletAdapter
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
class WaffleModule {

    @Provides
    fun providesMobileWalletAdapter(): MobileWalletAdapter {
        return MobileWalletAdapter()
    }

    @Provides
    fun providesMetaplexConnectionDriver(rpcConfig: IRpcConfig): Connection =
        SolanaConnectionDriver(
            JdkRpcDriver(rpcConfig.solanaRpcUrl),
            TransactionOptions(Commitment.CONFIRMED, skipPreflight = true)
        )
}