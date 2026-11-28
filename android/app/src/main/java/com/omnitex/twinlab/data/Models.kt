package com.omnitex.twinlab.data

import kotlinx.serialization.Serializable

/** Bounds arrives from the backend as {"min": x|null, "max": y|null}; both optional. */
@Serializable
data class Bounds(val min: Double? = null, val max: Double? = null)

@Serializable
data class Device(
    val device_id: String,
    val name: String,
    val location: String = "",
    val plant: String? = null,
    val sensors: List<String> = emptyList(),
    val thresholds: Map<String, Bounds> = emptyMap(),
    val source: String = "simulator",
    val status: String = "active",
    val asset_type: String? = null,
    val criticality: String = "medium",
    /** Present on GET /fleet and GET /devices/{id}/health rows — the backend's verdict. */
    val health: MachineHealth? = null,
) {
    /** Grouping key for the asset list. */
    val group: String get() = plant?.takeIf { it.isNotBlank() } ?: location.ifBlank { "Unassigned" }
}

/** Live reading (WebSocket broadcast) and last-known map values — `ts` is epoch ms. */
@Serializable
data class Reading(
    val device_id: String = "",
    val sensor: String = "",
    val value: Double,
    val unit: String = "",
    val ts: Long = 0,
)

/**
 * A point from `GET /devices/{id}/readings` (InfluxDB history). That endpoint
 * serialises `ts` as an ISO-8601 string, unlike the live [Reading] feed, so it
 * gets its own type. Sparklines only need `value`.
 */
@Serializable
data class HistoryPoint(
    val value: Double,
    val unit: String = "",
    val sensor: String = "",
    val ts: String = "",
)

@Serializable
data class Alert(
    val device_id: String,
    val sensor: String = "",
    val alert_type: String = "threshold",
    val severity: String = "warning",
    val value: Double = 0.0,
    val unit: String = "",
    val detail: String = "",
    val message_en: String = "",
    val message_ur: String = "",
    val ts: Long = 0,
    val created_at: String = "",
    val push_sent: Boolean = false,
)

/** One sensor inside the backend health verdict (backend/health.py). */
@Serializable
data class SensorHealth(
    val sensor: String,
    val label: String = sensor,
    val value: Double? = null,
    val unit: String = "",
    val min: Double? = null,
    val max: Double? = null,
    val status: String = "no_signal",
)

/** "This machine is showing an overheating trend" + what to check first. */
@Serializable
data class Trend(
    val name: String? = null,
    val title: String = "",
    val text: String = "",
    val checks: List<String> = emptyList(),
)

/** The backend's single verdict for a machine. The app renders it; it never re-derives it. */
@Serializable
data class MachineHealth(
    val status: String = "no_signal",
    val running: Boolean = false,
    val last_seen_ms: Long? = null,
    val sensors: List<SensorHealth> = emptyList(),
    val headline: String = "",
    val trend: Trend? = null,
)
