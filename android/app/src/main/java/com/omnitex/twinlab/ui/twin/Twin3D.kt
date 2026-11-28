package com.omnitex.twinlab.ui.twin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import com.google.android.filament.Engine
import com.google.android.filament.Skybox
import com.omnitex.twinlab.data.Device
import com.omnitex.twinlab.domain.Status
import com.omnitex.twinlab.domain.TwinParts
import io.github.sceneview.Scene
import io.github.sceneview.loaders.ModelLoader
import io.github.sceneview.math.Position
import io.github.sceneview.node.ModelNode
import io.github.sceneview.rememberCameraManipulator
import io.github.sceneview.rememberCameraNode
import io.github.sceneview.rememberNode
import io.github.sceneview.rememberScene
import kotlin.math.cos
import kotlin.math.sin

private const val DANGER_RGB = 0xC8281E
private const val CHECK_RGB = 0xE8A317
private const val SELECT_RGB = 0x3D7BD9

private fun rgb(hex: Int) = floatArrayOf(((hex shr 16) and 0xFF) / 255f, ((hex shr 8) and 0xFF) / 255f, (hex and 0xFF) / 255f)

/**
 * Live 3D twin of one machine, loaded from assets/models/<kind>.glb
 * (generated from frontend/src/twin/models.js — same models as the web dashboard).
 *
 * - breaching part glows (DANGER pulses red, CHECK amber), the machine shakes on DANGER
 * - the "run" animation (fan / pulley / coupling) plays only while the backend says it's running
 * - NO SIGNAL renders the whole machine grey and still
 * - interactive = drag to orbit / pinch to zoom; otherwise a static thumbnail
 *
 * engine + modelLoader are passed in so a list of twins shares one Filament engine.
 */
@Composable
fun Twin3D(
    device: Device,
    engine: Engine,
    modelLoader: ModelLoader,
    background: Color,
    modifier: Modifier = Modifier,
    interactive: Boolean = false,
    selectedPart: String? = null,
) {
    val kind = TwinParts.kindFor(device.asset_type)
    val status = Status.parse(device.health?.status)
    val grey = status == Status.NO_SIGNAL
    val ctx = LocalContext.current
    val reduceMotion = remember {
        android.provider.Settings.Global.getFloat(ctx.contentResolver, android.provider.Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }

    // Latest values for the frame callback, without rebuilding the scene.
    val glow by rememberUpdatedState(TwinParts.glowParts(kind, device.health))
    val running by rememberUpdatedState(device.health?.running == true && !grey)
    val shaking by rememberUpdatedState(status == Status.DANGER && !reduceMotion)
    val selected by rememberUpdatedState(if (interactive) selectedPart else null)

    val scene = rememberScene(engine).also { s ->
        s.skybox = remember(background) {
            Skybox.Builder().color(background.red, background.green, background.blue, 1f).build(engine)
        }
    }
    val center = rememberNode(engine)
    val cameraNode = rememberCameraNode(engine) {
        position = Position(x = 1.25f, y = 0.85f, z = 1.45f)
        lookAt(center)
    }
    // baseColor can't be read back to restore it, so a new instance loads whenever greying or the
    // set of dyed parts changes. A breaching part is dyed the status colour itself (same as web), not only lit.
    val dyed = TwinParts.glowParts(kind, device.health)
    val modelNode = remember(kind, grey, dyed) {
        ModelNode(
            modelInstance = modelLoader.createModelInstance("models/$kind.glb"),
            scaleToUnits = 1.0f,
        ).also { node ->
            if (grey) node.tint(engine, 0.62f)
            else if (dyed.isNotEmpty()) node.dye(engine, dyed)
        }
    }
    val animating = remember(modelNode) { BooleanArray(1) }
    val parts = remember(modelNode) { modelNode.partEntities() }

    Scene(
        modifier = modifier,
        engine = engine,
        modelLoader = modelLoader,
        scene = scene,
        cameraNode = cameraNode,
        cameraManipulator = if (interactive) {
            rememberCameraManipulator(orbitHomePosition = cameraNode.worldPosition, targetPosition = center.worldPosition)
        } else null,
        onGestureListener = null,
        childNodes = listOf(center, modelNode),
        onFrame = { nanos ->
            val t = nanos / 1e9
            if (running && !reduceMotion && !animating[0]) { modelNode.playAnimation(0, loop = true); animating[0] = true }
            if ((!running || reduceMotion) && animating[0]) { modelNode.stopAnimation(0); animating[0] = false }
            modelNode.position = if (shaking) Position(x = (sin(t * 61) * 0.012).toFloat(), z = (cos(t * 47) * 0.01).toFloat()) else Position()
            val pulse = if (reduceMotion) 0.8f else (0.775 + 0.225 * sin(t * 4)).toFloat()
            modelNode.applyGlow(engine, parts, glow, selected, pulse)
        },
    )
}

/** Every renderable whose glTF node is named part_<x>, grouped by x. */
private fun ModelNode.partEntities(): Map<String, List<Int>> {
    val asset = modelInstance.asset
    return asset.entities.toList()
        .mapNotNull { e -> asset.getName(e)?.takeIf { it.startsWith("part_") }?.let { it.removePrefix("part_").replace(Regex("_\\d+$"), "") to e } }
        .groupBy({ it.first }, { it.second })
}

private fun ModelNode.forEachMaterial(engine: Engine, entities: List<Int>, block: (com.google.android.filament.MaterialInstance) -> Unit) {
    val rm = engine.renderableManager
    for (e in entities) {
        if (!rm.hasComponent(e)) continue
        val ri = rm.getInstance(e)
        for (i in 0 until rm.getPrimitiveCount(ri)) block(rm.getMaterialInstanceAt(ri, i))
    }
}

private fun ModelNode.applyGlow(engine: Engine, parts: Map<String, List<Int>>, glow: Map<String, Status>, selected: String?, pulse: Float) {
    for ((part, entities) in parts) {
        val g = glow[part]
        val (c, k) = when {
            g == Status.DANGER -> rgb(DANGER_RGB) to pulse
            g == Status.CHECK -> rgb(CHECK_RGB) to pulse * 0.6f
            selected == part -> rgb(SELECT_RGB) to 0.35f
            else -> rgb(0) to 0f
        }
        forEachMaterial(engine, entities) { mi ->
            runCatching { mi.setParameter("emissiveFactor", c[0] * k, c[1] * k, c[2] * k) }
        }
    }
}

private fun ModelNode.dye(engine: Engine, dyed: Map<String, Status>) {
    for ((part, entities) in partEntities()) {
        val st = dyed[part] ?: continue
        val c = rgb(if (st == Status.DANGER) DANGER_RGB else CHECK_RGB)
        forEachMaterial(engine, entities) { mi -> runCatching { mi.setParameter("baseColorFactor", c[0], c[1], c[2], 1f) } }
    }
}

private fun ModelNode.tint(engine: Engine, grey: Float) {
    val all = modelInstance.asset.entities.toList()
    forEachMaterial(engine, all) { mi -> runCatching { mi.setParameter("baseColorFactor", grey, grey, grey, 1f) } }
}
