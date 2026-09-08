package com.bulgar.vpn

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private val Canvas = Color(0xFF0B1326)
private val CardColor = Color(0xFF131B2E)
private val Primary = Color(0xFFB4C5FF)

// A missing engine must fail closed. Never replace this with a simulated Connected flag.
interface TunnelController { suspend fun connect(): Result<Unit> }
class UnavailableTunnel : TunnelController {
    override suspend fun connect() = Result.failure<Unit>(IllegalStateException("VPN-ядро ещё не интегрировано"))
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(primary = Primary, background = Canvas, surface = CardColor)) {
                BulgarApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BulgarApp() {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var info by remember { mutableStateOf(false) }
    var search by rememberSaveable { mutableStateOf("") }
    var advanced by rememberSaveable { mutableStateOf(false) }
    val labels = listOf("Главная", "Серверы", "Профиль", "Настройки")
    val icons = listOf(Icons.Outlined.Shield, Icons.Outlined.Public, Icons.Outlined.Person, Icons.Outlined.Settings)
    Scaffold(
        containerColor = Canvas,
        topBar = { TopAppBar(title = { Text("Bulgar VPN", color = Primary, fontWeight = FontWeight.Bold) }) },
        bottomBar = {
            NavigationBar(containerColor = CardColor) {
                labels.forEachIndexed { index, label ->
                    NavigationBarItem(selected = tab == index, onClick = { tab = index },
                        icon = { Icon(icons[index], contentDescription = null) }, label = { Text(label) })
                }
            }
        }
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)) {
            Text("DEV • Туннель не подключён", color = Color(0xFFFBBF24), style = MaterialTheme.typography.labelLarge)
            when (tab) {
                0 -> {
                    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(24.dp)) {
                        Text("Не подключено", color = Color(0xFFFBBF24))
                        Box(Modifier.size(250.dp), contentAlignment = Alignment.Center) {
                            Icon(Icons.Outlined.Public, null, Modifier.size(250.dp), tint = Primary.copy(alpha = .12f))
                            FilledTonalIconButton(onClick = { info = true }, modifier = Modifier.size(140.dp), shape = CircleShape) {
                                Icon(Icons.Outlined.PowerSettingsNew, "Подключить VPN — ядро пока недоступно", Modifier.size(48.dp), tint = Primary)
                            }
                        }
                        Text("Ваше соединение — под вашим контролем", style = MaterialTheme.typography.headlineSmall,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        Text("Для подключения нужны аккаунт, доступный сервер и VPN-ядро.",
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    }
                    InfoPanel("Сервер не выбран", "Пинг и статистика появятся после реального подключения.")
                }
                1 -> {
                    Text("Выберите локацию", style = MaterialTheme.typography.headlineSmall)
                    OutlinedTextField(search, { search = it }, label = { Text("Страна или город") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    InfoPanel("Список серверов пуст", "Backend пока не связан с VPN-инфраструктурой. Демонстрационные страны не выдаются за рабочие серверы.")
                }
                2 -> {
                    Text("Ваш аккаунт", style = MaterialTheme.typography.headlineSmall)
                    InfoPanel("Вы не авторизованы", "Регистрация и вход реализованы в API. Мобильные формы и хранилище токенов на базе Android Keystore — следующий этап.")
                    InfoPanel("Устройства и подписка", "Без фиктивной подписки и оплаты. Статус появится после входа.")
                }
                3 -> {
                    Text("Настройки приложения", style = MaterialTheme.typography.headlineSmall)
                    InfoPanel("Безопасность", "Kill Switch и защита DNS требуют интеграции VpnService. Сейчас они не активны.")
                    TextButton(onClick = { advanced = !advanced }) { Text(if (advanced) "Скрыть расширенные настройки" else "Расширенные настройки") }
                    if (advanced) {
                        listOf("VLESS Reality", "Hysteria2", "Trojan", "Shadowsocks", "VMess", "SOCKS").forEach {
                            Row(Modifier.fillMaxWidth().background(CardColor, RoundedCornerShape(12.dp)).padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(it); Text("План", color = Primary)
                            }
                        }
                        Text("Выбор приложений для обхода VPN появится после подключения VpnService.")
                    }
                    Text("Версия 0.1 • Основа разработки")
                }
            }
        }
    }
    if (info) AlertDialog(onDismissRequest = { info = false }, title = { Text("VPN пока недоступен") },
        text = { Text("VPN-ядро ещё не интегрировано. Ваш трафик не защищён этим приложением.") },
        confirmButton = { TextButton(onClick = { info = false }) { Text("Понятно") } })
}

@Composable
private fun InfoPanel(title: String, description: String) {
    Surface(shape = RoundedCornerShape(16.dp), color = CardColor, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(description, color = Color(0xFFBAC5DA))
        }
    }
}
