package com.example.waffle

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.example.waffle.composables.WalletConnectButton
import com.example.waffle.ui.theme.WaffleTheme
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dagger.hilt.android.AndroidEntryPoint
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import com.solana.mobilewalletadapter.clientlib.ActivityResultSender
import androidx.compose.foundation.layout.fillMaxSize
import com.example.waffle.composables.WaffleCard

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val activityResultSender = ActivityResultSender(this)

        setContent {
            WaffleTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Column(
                        modifier=Modifier.padding(16.dp),
                    ) {
                        WalletConnectButton(
                            identityUri = Uri.parse(application.getString((R.string.id_url))),
                            iconUri = Uri.parse(application.getString(R.string.id_favicon)),
                            identityName = application.getString(R.string.app_name),
                            activityResultSender = activityResultSender,
                            modifier = Modifier.align(Alignment.End)
                        )
                        WaffleCard(
                            identityUri = Uri.parse(application.getString(R.string.id_url)),
                            iconUri = Uri.parse(application.getString(R.string.id_favicon)),
                            identityName = application.getString(R.string.app_name),
                            intentSender = activityResultSender,
                            modifier = Modifier.fillMaxSize(),
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    WaffleTheme {
        Greeting("Android")
    }
}