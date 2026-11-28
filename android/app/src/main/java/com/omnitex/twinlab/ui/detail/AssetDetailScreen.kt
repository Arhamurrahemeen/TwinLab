package com.omnitex.twinlab.ui.detail

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.omnitex.twinlab.data.SensorHealth
import com.omnitex.twinlab.domain.Status
import com.omnitex.twinlab.domain.TwinParts
import com.omnitex.twinlab.ui.common.StatusChip
import com.omnitex.twinlab.ui.common.TwinLabTopBar
import com.omnitex.twinlab.ui.common.relativeTime
import com.omnitex.twinlab.ui.common.severityColor
import com.omnitex.twinlab.ui.theme.CardMount
import com.omnitex.twinlab.ui.theme.Check
import com.omnitex.twinlab.ui.theme.Danger
import com.omnitex.twinlab.ui.theme.Indigo
import com.omnitex.twinlab.ui.theme.Ink2
import com.omnitex.twinlab.ui.theme.NoSignal
import com.omnitex.twinlab.ui.theme.Rule
import com.omnitex.twinlab.ui.theme.Rule2
import com.omnitex.twinlab.ui.theme.Selected
import com.omnitex.twinlab.ui.twin.Twin3D
import io.github.sceneview.rememberEngine
import io.github.sceneview.rememberModelLoader

@Composable
fun AssetDetailScreen(vm: AssetDetailViewModel, onBack: () -> Unit) {
    val s by vm.state.collectAsStateWithLifecycle()
    val d = s.device
    val engine = rememberEngine()
    val modelLoader = rememberModelLoader(engine)

    Scaffold(
        topBar = {
            TwinLabTopBar(
                title = { Text(d?.name ?: "Machine", maxLines = 1) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") } },
            )
        },
    ) { pad ->
        if (d == null) {
            Box(Modifier.fillMaxSize().padding(pad).padding(24.dp), contentAlignment = Alignment.Center) {
                if (s.error != null) Text("Can’t load this machine.\n${s.error}", color = MaterialTheme.colorScheme.error)
                else CircularProgressIndicator()
            }
            return@Scaffold
        }
        val h = d.health
        val status = Status.parse(h?.status)
        val kind = TwinParts.kindFor(d.asset_type)
        val sel = h?.sensors?.find { it.sensor == s.selectedSensor }

        LazyColumn(Modifier.fillMaxSize().padding(pad).background(Color.White)) {
            item {
                Box(Modifier.fillMaxWidth().height(320.dp).background(CardMount)) {
                    Twin3D(
                        d, engine, modelLoader, background = CardMount, interactive = true,
                        selectedPart = s.selectedSensor?.let { TwinParts.partFor(kind, it) },
                        modifier = Modifier.fillMaxSize().semantics { contentDescription = "3D twin of ${d.name}. Drag to rotate, pinch to zoom." },
                    )
                    Text(
                        "Drag to rotate · pinch to zoom",
                        color = Ink2, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.align(Alignment.BottomStart).padding(12.dp),
                    )
                }
            }
            item {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (s.stale) Text("Connection lost · showing last known", color = Danger, fontWeight = FontWeight.Bold)
                    StatusChip(status, Modifier.fillMaxWidth(), height = 60.dp, fontSize = 32.sp)
                    Text(h?.headline.orEmpty(), style = MaterialTheme.typography.headlineSmall)
                    h?.trend?.let { TrendBox(status, it.title, it.text, it.checks) }
                    if (h != null && h.sensors.isNotEmpty()) {
                        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            h.sensors.forEach { sh ->
                                FilterChip(
                                    selected = sh.sensor == s.selectedSensor,
                                    onClick = { vm.select(sh.sensor) },
                                    label = { Text("${sh.label} · ${fmt(sh.value)} ${sh.unit}".trim()) },
                                    leadingIcon = if (Status.parse(sh.status) != Status.OK) {
                                        { StatusMark(Status.parse(sh.status)) }
                                    } else null,
                                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Selected),
                                )
                            }
                        }
                    }
                    if (sel != null) HistoryChart(sel, s.history.map { it.value })
                }
            }
            if (s.alerts.isNotEmpty()) {
                item { Text("Recent alerts", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) }
                items(s.alerts.take(10), key = { "a-${it.ts}-${it.sensor}-${it.alert_type}" }) { a ->
                    Column(Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
                        Text("${a.severity.uppercase()} · ${a.sensor.replace('_', ' ')}", color = severityColor(a.severity), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(a.message_en.ifBlank { a.detail }, style = MaterialTheme.typography.bodyMedium)
                        Text(relativeTime(a.created_at.ifBlank { a.ts.toString() }), color = Ink2, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

/** "This machine is showing an overheating trend" + what happened + what to check first. */
@Composable
private fun TrendBox(status: Status, title: String, text: String, checks: List<String>) {
    val border = when (status) { Status.DANGER -> Danger; Status.CHECK -> Check; Status.NO_SIGNAL -> NoSignal; Status.OK -> Rule }
    Column(Modifier.fillMaxWidth().border(2.dp, border).padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
        Text(text, style = MaterialTheme.typography.bodyMedium)
        if (checks.isNotEmpty()) {
            Text("CHECK FIRST", color = Ink2, fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 0.8.sp)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                checks.forEach { Text(it, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, modifier = Modifier.background(CardMount).padding(8.dp, 5.dp)) }
            }
        }
    }
}

@Composable
private fun StatusMark(st: Status) = Box(Modifier.padding(2.dp)) {
    Canvas(Modifier.size(10.dp)) { drawCircle(if (st == Status.DANGER) Danger else if (st == Status.CHECK) Check else NoSignal, 5.dp.toPx()) }
}

/** Last hour of the selected sensor: limit as a dashed line, breach onset marked. */
@Composable
private fun HistoryChart(s: SensorHealth, values: List<Double>) {
    Column(Modifier.fillMaxWidth().border(1.dp, Rule2).padding(12.dp)) {
        Row(Modifier.fillMaxWidth()) {
            Text("${s.label} · ${fmt(s.value)} ${s.unit}", fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f))
            Text("recent readings", color = Ink2, fontSize = 13.sp)
        }
        if (values.size < 2) {
            Text("Not enough recent readings to draw a trend.", color = Ink2, modifier = Modifier.padding(vertical = 20.dp))
            return@Column
        }
        val st = Status.parse(s.status)
        val line = when (st) { Status.DANGER -> Danger; Status.CHECK -> Color(0xFF9A6B00); else -> Indigo }
        val limits = listOfNotNull(s.min, s.max)
        val out = { v: Double -> (s.max != null && v > s.max) || (s.min != null && v < s.min) }
        var onset = -1
        if (out(values.last())) { onset = values.lastIndex; while (onset > 0 && out(values[onset - 1])) onset-- }
        Canvas(Modifier.fillMaxWidth().height(150.dp).padding(top = 8.dp).semantics { contentDescription = "${s.label} recent readings" }) {
            var lo = (values + limits).min(); var hi = (values + limits).max()
            val pad = ((hi - lo).takeIf { it > 0 } ?: 1.0) * 0.12; lo -= pad; hi += pad
            val x = { i: Int -> i * size.width / (values.size - 1) }
            val y = { v: Double -> (size.height - (v - lo) / (hi - lo) * size.height).toFloat() }
            if (onset >= 0) {
                drawRect(line.copy(alpha = .08f), Offset(x(onset), 0f), androidx.compose.ui.geometry.Size(size.width - x(onset), size.height))
                drawLine(line, Offset(x(onset), 0f), Offset(x(onset), size.height), 3f)
            }
            limits.forEach { l -> drawLine(Danger, Offset(0f, y(l)), Offset(size.width, y(l)), 3f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(14f, 9f))) }
            val p = Path().apply { values.forEachIndexed { i, v -> if (i == 0) moveTo(x(i), y(v)) else lineTo(x(i), y(v)) } }
            drawPath(p, line, style = Stroke(5f))
        }
        Row(Modifier.fillMaxWidth()) {
            Text(limits.joinToString(" · ") { "limit ${fmt(it)} ${s.unit}" }, color = Danger, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            if (onset >= 0) Text("outside limit for the last ${values.size - onset} readings", color = line, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

private fun fmt(v: Double?): String = when {
    v == null -> "—"
    kotlin.math.abs(v) < 10 -> "%.2f".format(v).trimEnd('0').trimEnd('.')
    else -> "%.1f".format(v).trimEnd('0').trimEnd('.')
}

