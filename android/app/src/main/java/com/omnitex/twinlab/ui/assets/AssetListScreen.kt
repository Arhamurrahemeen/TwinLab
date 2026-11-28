package com.omnitex.twinlab.ui.assets

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.omnitex.twinlab.data.Device
import com.omnitex.twinlab.domain.Status
import com.omnitex.twinlab.ui.common.RibbonChip
import com.omnitex.twinlab.ui.common.StatusChip
import com.omnitex.twinlab.ui.common.TwinLabTopBar
import com.omnitex.twinlab.ui.common.TwinLabWordmark
import com.omnitex.twinlab.ui.theme.Danger
import com.omnitex.twinlab.ui.theme.Indigo
import com.omnitex.twinlab.ui.theme.IndigoInk
import com.omnitex.twinlab.ui.theme.Ink2
import com.omnitex.twinlab.ui.theme.Rule
import com.omnitex.twinlab.ui.theme.Tile
import com.omnitex.twinlab.ui.twin.Twin3D
import io.github.sceneview.rememberEngine
import io.github.sceneview.rememberModelLoader

@Composable
fun AssetListScreen(
    vm: AssetListViewModel,
    onOpen: (String) -> Unit,
    onAlerts: () -> Unit,
    onSettings: () -> Unit,
) {
    val state by vm.state.collectAsStateWithLifecycle()
    // One Filament engine for every twin in the list.
    val engine = rememberEngine()
    val modelLoader = rememberModelLoader(engine)

    Scaffold(
        topBar = {
            TwinLabTopBar(
                title = { TwinLabWordmark() },
                actions = {
                    IconButton(onClick = onAlerts) { Icon(Icons.Default.Notifications, contentDescription = "Alerts") }
                    IconButton(onClick = onSettings) { Icon(Icons.Default.Settings, contentDescription = "Settings") }
                },
            )
        },
    ) { pad ->
        when (val s = state) {
            AssetListViewModel.UiState.Loading -> Center(pad) { CircularProgressIndicator() }
            is AssetListViewModel.UiState.Error -> Center(pad) {
                Text("Can’t reach TwinLab.\n${s.msg}\nCheck the backend address in Settings.", color = MaterialTheme.colorScheme.error)
            }
            is AssetListViewModel.UiState.Content -> Column(Modifier.fillMaxSize().padding(pad)) {
                Summary(s)
                if (s.machines.isEmpty()) {
                    Center(PaddingValues()) { Text("No machines registered yet. Add one from the web dashboard.") }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        items(s.machines, key = { it.device_id }) { d ->
                            MachineRow(d, engine, modelLoader) { onOpen(d.device_id) }
                        }
                    }
                }
            }
        }
    }
}

/** Indigo band under the app bar: counts in words, then one ribbon chip per machine, worst first. */
@Composable
private fun Summary(s: AssetListViewModel.UiState.Content) {
    Column(Modifier.fillMaxWidth().background(Indigo).padding(start = 16.dp, end = 16.dp, bottom = 14.dp)) {
        val parts = listOf(Status.DANGER, Status.CHECK, Status.NO_SIGNAL, Status.OK)
            .mapNotNull { st -> s.count(st).takeIf { it > 0 }?.let { "$it ${st.word}" } }
        Text(
            (if (s.stale) "Connection lost · last known  ·  " else "") + parts.joinToString(" · "),
            color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp,
        )
        Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            s.machines.take(8).forEach { d ->
                val st = Status.parse(d.health?.status)
                RibbonChip(st, Modifier.weight(1f).semantics { contentDescription = "${d.name}: ${st.word}" })
            }
        }
        if (s.machines.size > 8) Text("+${s.machines.size - 8} more below", color = IndigoInk, fontSize = 13.sp, modifier = Modifier.padding(top = 6.dp))
    }
}

@Composable
private fun MachineRow(d: Device, engine: com.google.android.filament.Engine, modelLoader: io.github.sceneview.loaders.ModelLoader, onClick: () -> Unit) {
    val st = Status.parse(d.health?.status)
    Box(
        Modifier
            .fillMaxWidth()
            .background(Color.White)
            .border(if (st == Status.DANGER) 2.dp else 1.dp, if (st == Status.DANGER) Danger else Rule),
    ) {
        Row(Modifier.fillMaxWidth().height(124.dp)) {
            Twin3D(d, engine, modelLoader, background = Tile, modifier = Modifier.width(112.dp).height(124.dp))
            Column(
                Modifier.padding(start = 10.dp, end = 12.dp, top = 10.dp, bottom = 10.dp).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(d.name, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(d.plant ?: d.location.ifBlank { null }, if (d.source == "hardware") "real sensor" else "simulated").joinToString(" · "),
                    color = Ink2, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
                StatusChip(st, Modifier.fillMaxWidth(), height = 34.dp, fontSize = 17.sp)
                Text(d.health?.headline.orEmpty(), fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        // The 3D surface would swallow taps; this layer makes the whole row one target.
        Box(Modifier.matchParentSize().clickable(onClickLabel = "Open ${d.name}", onClick = onClick))
    }
}

@Composable
private fun Center(pad: PaddingValues, content: @Composable () -> Unit) =
    Box(Modifier.fillMaxSize().padding(pad).padding(24.dp), contentAlignment = Alignment.Center) { content() }
