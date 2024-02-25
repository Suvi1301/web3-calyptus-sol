package com.example.waffle.composables

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp


@Composable
fun WalletConnectButton(modifier: Modifier) {
    Column(modifier=modifier) {
        Button(
            modifier=modifier,
            onClick={

            },
        ) {
            Text(
                modifier=Modifier.padding(start=8.dp),
                text="Connect Wallet",
                maxLines=1,
            )
        }
    }
}