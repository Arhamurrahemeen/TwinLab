package com.omnitex.twinlab.domain

import com.omnitex.twinlab.data.MachineHealth

/**
 * Which 3D model and which model part carry each sensor.
 * Mirrors frontend/src/twin/models.js (kindFor + SENSOR_PART); the .glb files
 * in assets/models/ are generated from that same file (`npm run models`).
 */
object TwinParts {
    fun kindFor(assetType: String?): String = when (assetType) {
        "genset", "generator" -> "genset"
        "compressor" -> "compressor"
        else -> "pump"
    }

    fun modelPath(assetType: String?) = "models/${kindFor(assetType)}.glb"

    private val SENSOR_PART = mapOf(
        "genset" to mapOf("temperature" to "engine", "vibration" to "engine", "humidity" to "engine", "fuel_level" to "tank", "load_current" to "alternator"),
        "compressor" to mapOf("temperature" to "head", "vibration" to "head", "humidity" to "motor", "load_current" to "motor"),
        "pump" to mapOf("temperature" to "motor", "vibration" to "motor", "humidity" to "motor", "load_current" to "motor"),
    )

    fun partFor(kind: String, sensor: String): String? = SENSOR_PART[kind]?.get(sensor)

    /** part → DANGER/CHECK for every part carrying a breaching sensor (DANGER wins). */
    fun glowParts(kind: String, health: MachineHealth?): Map<String, Status> {
        if (health == null || Status.parse(health.status) == Status.NO_SIGNAL) return emptyMap()
        val out = mutableMapOf<String, Status>()
        for (s in health.sensors) {
            val st = Status.parse(s.status)
            if (st != Status.DANGER && st != Status.CHECK) continue
            val part = partFor(kind, s.sensor) ?: continue
            if (out[part] != Status.DANGER) out[part] = st
        }
        return out
    }
}
