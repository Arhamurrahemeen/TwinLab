package com.omnitex.twinlab.domain

/**
 * Machine status as the backend decides it (backend/health.py). The app only
 * parses and draws it, so the phone can never disagree with the dashboard.
 */
enum class Status(val word: String, val rank: Int) {
    DANGER("DANGER", 0),
    CHECK("CHECK", 1),
    NO_SIGNAL("NO SIGNAL", 2),
    OK("OK", 3);

    companion object {
        fun parse(s: String?): Status = when (s) {
            "danger" -> DANGER
            "check" -> CHECK
            "ok" -> OK
            else -> NO_SIGNAL
        }
    }
}
