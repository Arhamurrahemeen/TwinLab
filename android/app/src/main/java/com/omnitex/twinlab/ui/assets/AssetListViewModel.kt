package com.omnitex.twinlab.ui.assets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omnitex.twinlab.data.Device
import com.omnitex.twinlab.data.TwinLabApi
import com.omnitex.twinlab.domain.Status
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** Polls GET /fleet: every machine with the backend's verdict, worst first. */
class AssetListViewModel(
    private val apiFlow: StateFlow<TwinLabApi?>,
) : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Content(val machines: List<Device>, val stale: Boolean = false) : UiState {
            fun count(s: Status) = machines.count { Status.parse(it.health?.status) == s }
        }
        data class Error(val msg: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            while (isActive) {
                load()
                delay(3_000)
            }
        }
    }

    fun refresh() {
        viewModelScope.launch { load() }
    }

    private suspend fun load() {
        val api = apiFlow.value ?: run {
            _state.value = UiState.Error("No backend configured")
            return
        }
        try {
            _state.value = UiState.Content(api.getFleet())
        } catch (e: Exception) {
            // keep showing the last fleet, flagged stale, rather than blanking the screen
            val prev = _state.value
            _state.value = if (prev is UiState.Content) prev.copy(stale = true)
            else UiState.Error(e.message ?: "Failed to load machines")
        }
    }
}
