package com.omnitex.twinlab.ui.common

import androidx.compose.animation.animateColor
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omnitex.twinlab.domain.Status
import com.omnitex.twinlab.ui.theme.Check
import com.omnitex.twinlab.ui.theme.CheckTint
import com.omnitex.twinlab.ui.theme.Danger
import com.omnitex.twinlab.ui.theme.DangerDeep
import com.omnitex.twinlab.ui.theme.Ink
import com.omnitex.twinlab.ui.theme.NoSignal
import com.omnitex.twinlab.ui.theme.CardMount
import com.omnitex.twinlab.ui.theme.Ok

/** Severity text colour for an alert severity string (alerts list). */
fun severityColor(severity: String): Color = when (severity.lowercase()) {
    "critical" -> Danger
    "warning" -> Check
    else -> NoSignal
}

private fun reduceMotion(ctx: android.content.Context): Boolean =
    android.provider.Settings.Global.getFloat(ctx.contentResolver, android.provider.Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f

/**
 * Status as a WORD + an icon + a pattern + a colour — readable at a glance,
 * in greyscale and for colour-blind owners. DANGER solid red (gently throbbing),
 * CHECK amber stripes, OK green outline, NO SIGNAL dotted grey.
 */
@Composable
fun StatusChip(
    status: Status,
    modifier: Modifier = Modifier,
    height: Dp = 36.dp,
    fontSize: TextUnit = 18.sp,
    label: String = status.word,
) {
    val anim = !reduceMotion(LocalContext.current)
    val throb by rememberInfiniteTransition(label = "throb").animateColor(
        initialValue = Danger,
        targetValue = if (anim) DangerDeep else Danger,
        animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse),
        label = "throb",
    )
    val (border, fg) = when (status) {
        Status.DANGER -> Danger to Color.White
        Status.CHECK -> Check to Ink
        Status.OK -> Ok to Ok
        Status.NO_SIGNAL -> NoSignal to Ink
    }
    Box(
        modifier
            .height(height)
            .background(if (status == Status.DANGER) throb else if (status == Status.OK) Color.White else CardMount)
            .border(2.dp, border)
            .semantics { contentDescription = "Status: $label" },
        contentAlignment = Alignment.Center,
    ) {
        // pattern layer
        Canvas(Modifier.fillMaxSize()) {
            when (status) {
                Status.CHECK -> clipRect {
                    drawRect(CheckTint)
                    val step = 12.dp.toPx()
                    var x = -size.height
                    while (x < size.width + size.height) {
                        drawLine(Check, Offset(x, size.height), Offset(x + size.height, 0f), strokeWidth = 6.dp.toPx() * 0.7f)
                        x += step
                    }
                }
                Status.NO_SIGNAL -> {
                    val step = 8.dp.toPx()
                    var y = step / 2
                    while (y < size.height) {
                        var x = step / 2
                        while (x < size.width) { drawCircle(NoSignal, 1.4.dp.toPx(), Offset(x, y)); x += step }
                        y += step
                    }
                }
                else -> Unit
            }
        }
        Row(
            Modifier
                .background(if (status == Status.CHECK || status == Status.NO_SIGNAL) Color.White else Color.Transparent)
                .padding(horizontal = 7.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            StatusIcon(status, fg, (fontSize.value * 0.95f).dp)
            Text(label, color = fg, fontSize = fontSize, fontWeight = FontWeight.ExtraBold, maxLines = 1)
        }
    }
}

@Composable
private fun StatusIcon(status: Status, color: Color, size: Dp) {
    Canvas(Modifier.size(size)) {
        val w = this.size.width
        val sw = w * 0.12f
        when (status) {
            Status.DANGER -> {
                drawCircle(color.copy(alpha = .3f))
                drawRect(color, Offset(w * .2f, w * .42f), androidx.compose.ui.geometry.Size(w * .6f, w * .16f))
            }
            Status.CHECK -> {
                val p = Path().apply { moveTo(w / 2, w * .08f); lineTo(w * .95f, w * .9f); lineTo(w * .05f, w * .9f); close() }
                drawPath(p, color, style = Stroke(sw))
                drawLine(color, Offset(w / 2, w * .38f), Offset(w / 2, w * .62f), sw)
                drawCircle(color, sw * .6f, Offset(w / 2, w * .75f))
            }
            Status.OK -> {
                val p = Path().apply { moveTo(w * .18f, w * .52f); lineTo(w * .4f, w * .74f); lineTo(w * .82f, w * .28f) }
                drawPath(p, color, style = Stroke(sw * 1.2f, cap = StrokeCap.Square))
            }
            Status.NO_SIGNAL -> {
                drawLine(color, Offset(w * .15f, w * .15f), Offset(w * .85f, w * .85f), sw)
                drawLine(color, Offset(w * .85f, w * .15f), Offset(w * .15f, w * .85f), sw)
            }
        }
    }
}

/** Compact full-width chip used in the shade-card ribbon (no text, pattern + icon only). */
@Composable
fun RibbonChip(status: Status, modifier: Modifier = Modifier) =
    StatusChip(status, modifier.fillMaxWidth(), height = 28.dp, fontSize = 0.sp, label = "")
