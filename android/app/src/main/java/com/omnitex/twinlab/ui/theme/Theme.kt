package com.omnitex.twinlab.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ShadeCard = lightColorScheme(
    primary = Indigo,
    onPrimary = Color.White,
    primaryContainer = Indigo2,
    onPrimaryContainer = Color.White,
    secondary = Indigo2,
    onSecondary = Color.White,
    secondaryContainer = Selected,
    onSecondaryContainer = Ink,
    background = CardMount,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    surfaceVariant = Tile,
    onSurfaceVariant = Ink2,
    outline = Rule,
    outlineVariant = Rule2,
    error = Danger,
)

@Composable
fun TwinLabTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = ShadeCard, typography = TwinLabTypography, content = content)
}
