package com.omnitex.twinlab

import com.omnitex.twinlab.data.MachineHealth
import com.omnitex.twinlab.data.SensorHealth
import com.omnitex.twinlab.domain.Status
import com.omnitex.twinlab.domain.TwinParts
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TwinPartsTest {
    @Test fun `status parse falls back to no signal`() {
        assertEquals(Status.DANGER, Status.parse("danger"))
        assertEquals(Status.NO_SIGNAL, Status.parse(null))
        assertEquals(Status.NO_SIGNAL, Status.parse("garbage"))
        assertTrue(Status.DANGER.rank < Status.CHECK.rank && Status.NO_SIGNAL.rank < Status.OK.rank)
    }

    @Test fun `generator maps to the genset model, unknown types to pump`() {
        assertEquals("models/genset.glb", TwinParts.modelPath("generator"))
        assertEquals("pump", TwinParts.kindFor("chiller"))
        assertEquals("pump", TwinParts.kindFor(null))
    }

    @Test fun `breaching sensors glow their part, danger wins over check`() {
        val h = MachineHealth(
            status = "danger",
            sensors = listOf(
                SensorHealth("humidity", status = "check"),
                SensorHealth("temperature", status = "danger"),
                SensorHealth("fuel_level", status = "ok"),
            ),
        )
        assertEquals(mapOf("engine" to Status.DANGER), TwinParts.glowParts("genset", h))
    }

    @Test fun `no signal glows nothing`() {
        val h = MachineHealth(status = "no_signal", sensors = listOf(SensorHealth("temperature", status = "danger")))
        assertTrue(TwinParts.glowParts("genset", h).isEmpty())
    }
}
