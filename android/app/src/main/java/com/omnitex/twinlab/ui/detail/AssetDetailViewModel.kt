package com.omnitex.twinlab.ui.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitex.twinlab.data.Alert
import com.omnitex.twinlab.data.Device
import com.omnitex.twinlab.data.HistoryPoint
import com.omnitex.twinlab.data.TwinLabApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * One machine: polls GET /devices/{id}/health (verdict + fault trend) and the
 * selected sensor's last hour. The status shown is the backend's, never re-derived here.
 */
class AssetDetailViewModel(
    private val deviceId: String,
    private val apiFlow: StateFlow<TwinLabApi?>,
    @Suppress("unused") private val baseUrlFlow: StateFlow<String?>,
) : ViewModel() {

    data class DetailUiState(
        val device: Device? = null,
        val selectedSensor: String? = null,
        val history: List<HistoryPoint> = emptyList(),
        val alerts: List<Alert> = emptyList(),
        val stale: Boolean = false,
        val error: String? = null,
    )

    private val _state = MutableStateFlow(DetailUiState())
    val state: StateFlow<DetailUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            while (isActive) {
                loadHealth()
                delay(3_000)
            }
        }
        viewModelScope.launch {
            while (isActive) {
                loadHistory()
                loadAlerts()
                delay(10_000)
            }
        }
    }

    fun select(sensor: String) {
        _state.update { it.copy(selectedSensor = sensor, history = emptyList()) }
        viewModelScope.launch { loadHistory() }
    }

    fun refresh() = viewModelScope.launch { loadHealth(); loadHistory(); loadAlerts() }

    private suspend fun loadHealth() {
        val api = apiFlow.value ?: run { _state.update { it.copy(error = "No backend configured") }; return }
        try {
            val d = api.getHealth(deviceId)
            val first = _state.value.selectedSensor == null
            _state.update {
                it.copy(device = d, stale = false, error = null,
                    selectedSensor = it.selectedSensor ?: d.health?.sensors?.firstOrNull()?.sensor)
            }
            if (first) loadHistory()
        } catch (e: Exception) {
            _state.update { if (it.device != null) it.copy(stale = true) else it.copy(error = e.message ?: "Failed to load machine") }
        }
    }

    private suspend fun loadHistory() {
        val api = apiFlow.value ?: return
        val sensor = _state.value.selectedSensor ?: return
        runCatching { api.getReadings(deviceId, sensor, limit = 120, rangeHours = 1) }
            .onSuccess { pts -> _state.update { if (it.selectedSensor == sensor) it.copy(history = pts) else it } }
    }

    private suspend fun loadAlerts() {
        val api = apiFlow.value ?: return
        runCatching { api.getDeviceAlerts(deviceId, 20) }.onSuccess { a -> _state.update { it.copy(alerts = a) } }
    }
}
