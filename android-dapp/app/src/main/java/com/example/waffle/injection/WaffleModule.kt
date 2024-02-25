package com.example.waffle.injection

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
}