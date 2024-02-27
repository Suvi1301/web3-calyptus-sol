package com.example.waffle.data

import com.solana.api.Api
import com.solana.networking.Commitment
import com.solana.networking.RpcRequest
import com.solana.networking.makeRequestResult
import com.solana.networking.serialization.serializers.solana.SolanaResponseSerializer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put


class LatestBlockhashRequest : RpcRequest() {
    override val method: String = "getLatestBlockhash"
    override val params = buildJsonArray {
        add(
            buildJsonObject {
                put("commitment", Commitment.FINALIZED.value)
            },
        )
    }
}

@Serializable
internal data class BlockHashResponse(val blockhash: String, val lastValidBlockHeight: Long)

internal fun blockHashSerializer() =
    SolanaResponseSerializer(BlockHashResponse.serializer())


suspend fun Api.getLatestBlockHash() : Result<String> =
    router.makeRequestResult(LatestBlockhashRequest(), blockHashSerializer()).let { result ->
        @Suppress("UNCHECKED_CAST")
        if (result.isSuccess && result.getOrNull() == null) {
            Result.failure(Error("Can not be null"))
        } else {
            result.map { it?.blockhash!! } // safe case, null case handled above.
        }
    }

fun Api.getLatestBlockHash(onComplete: ((Result<String>) -> Unit)) {
    CoroutineScope(dispatcher).launch {
        onComplete(getLatestBlockHash())
    }
}


class SolanaResponseSerializer<R>(dataSerializer: KSerializer<R>) : KSerializer<R?> {
    private val serializer = WrappedValue.serializer(dataSerializer)
    override val descriptor: SerialDescriptor = serializer.descriptor

    override fun serialize(encoder: Encoder, value: R?) =
        encoder.encodeSerializableValue(serializer, WrappedValue(value))

    override fun deserialize(decoder: Decoder): R? =
        decoder.decodeSerializableValue(serializer).value
}

@Serializable
private class WrappedValue<V>(val value: V?)