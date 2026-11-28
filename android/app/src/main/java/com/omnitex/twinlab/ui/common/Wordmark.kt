package com.omnitex.twinlab.ui.common

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import com.omnitex.twinlab.ui.theme.LabOnIndigo

/** "TwinLab" lockup on the indigo bar: white "Twin" + light-teal "Lab". */
@Composable
fun TwinLabWordmark() {
    Text(
        buildAnnotatedString {
            withStyle(SpanStyle(color = Color.White)) { append("Twin") }
            withStyle(SpanStyle(color = LabOnIndigo)) { append("Lab") }
        },
        style = MaterialTheme.typography.titleLarge,
    )
}
