@file:OptIn(androidx.compose.ui.text.ExperimentalTextApi::class)

package com.omnitex.twinlab.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import com.omnitex.twinlab.R

private fun archivo(weight: FontWeight) = Font(
    resId = R.font.archivo_variable,
    weight = weight,
    variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)),
)

/** Archivo: an industrial grotesque that stays legible at distance; same face as the web dashboard. */
val Archivo = FontFamily(
    archivo(FontWeight.Normal), archivo(FontWeight.Medium), archivo(FontWeight.SemiBold),
    archivo(FontWeight.Bold), archivo(FontWeight.ExtraBold),
)

val TwinLabTypography = Typography().let { b ->
    Typography(
        displayLarge = b.displayLarge.copy(fontFamily = Archivo, fontWeight = FontWeight.ExtraBold),
        displayMedium = b.displayMedium.copy(fontFamily = Archivo, fontWeight = FontWeight.ExtraBold),
        displaySmall = b.displaySmall.copy(fontFamily = Archivo, fontWeight = FontWeight.ExtraBold),
        headlineLarge = b.headlineLarge.copy(fontFamily = Archivo, fontWeight = FontWeight.ExtraBold),
        headlineMedium = b.headlineMedium.copy(fontFamily = Archivo, fontWeight = FontWeight.ExtraBold),
        headlineSmall = b.headlineSmall.copy(fontFamily = Archivo, fontWeight = FontWeight.ExtraBold),
        titleLarge = b.titleLarge.copy(fontFamily = Archivo, fontWeight = FontWeight.ExtraBold),
        titleMedium = b.titleMedium.copy(fontFamily = Archivo, fontWeight = FontWeight.Bold),
        titleSmall = b.titleSmall.copy(fontFamily = Archivo, fontWeight = FontWeight.Bold),
        bodyLarge = b.bodyLarge.copy(fontFamily = Archivo),
        bodyMedium = b.bodyMedium.copy(fontFamily = Archivo),
        bodySmall = b.bodySmall.copy(fontFamily = Archivo),
        labelLarge = b.labelLarge.copy(fontFamily = Archivo, fontWeight = FontWeight.Bold),
        labelMedium = b.labelMedium.copy(fontFamily = Archivo, fontWeight = FontWeight.SemiBold),
        labelSmall = b.labelSmall.copy(fontFamily = Archivo, fontWeight = FontWeight.SemiBold),
    )
}
