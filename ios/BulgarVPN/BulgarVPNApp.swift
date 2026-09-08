import SwiftUI

private enum Brand {
    static let background = Color(red: 11/255, green: 19/255, blue: 38/255)
    static let card = Color(red: 19/255, green: 27/255, blue: 46/255)
    static let primary = Color(red: 180/255, green: 197/255, blue: 1)
    static let green = Color(red: 16/255, green: 185/255, blue: 129/255)
}

// The first milestone contains no tunnel implementation. Never simulate Connected.
protocol TunnelControlling { func connect() async throws }
struct UnavailableTunnel: TunnelControlling {
    struct NotIntegrated: LocalizedError {
        var errorDescription: String? { "VPN-ядро ещё не интегрировано. Ваш трафик не защищён этим приложением." }
    }
    func connect() async throws { throw NotIntegrated() }
}

@main
struct BulgarVPNApp: App {
    var body: some Scene {
        WindowGroup { RootView().preferredColorScheme(.dark).tint(Brand.primary) }
    }
}

struct RootView: View {
    @State private var message: String?
    @State private var search = ""
    @State private var advanced = false
    private let tunnel = UnavailableTunnel()
    var body: some View {
        TabView {
            page("Подключение") { connectView }.tabItem { Label("Главная", systemImage: "shield") }
            page("Серверы") { serversView }.tabItem { Label("Серверы", systemImage: "globe") }
            page("Профиль") { profileView }.tabItem { Label("Профиль", systemImage: "person.crop.circle") }
            page("Настройки") { settingsView }.tabItem { Label("Настройки", systemImage: "gearshape") }
        }
        .alert("Bulgar VPN", isPresented: Binding(get: { message != nil }, set: { if !$0 { message = nil } })) {
            Button("Понятно", role: .cancel) { message = nil }
        } message: { Text(message ?? "") }
    }
    private func page<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("DEV • Туннель не подключён").font(.caption).foregroundColor(.orange)
                    content()
                }.padding(20).frame(maxWidth: 560)
            }
            .frame(maxWidth: .infinity).background(Brand.background.ignoresSafeArea())
            .navigationTitle("Bulgar VPN").navigationBarTitleDisplayMode(.inline)
            .accessibilityLabel(title)
        }.navigationViewStyle(.stack)
    }
    private func panel<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12, content: content)
            .frame(maxWidth: .infinity, alignment: .leading).padding(20)
            .background(Brand.card).cornerRadius(16)
    }
    private var connectView: some View {
        VStack(spacing: 24) {
            Label("Не подключено", systemImage: "lock.open").foregroundColor(.orange)
            ZStack {
                Image(systemName: "globe").resizable().scaledToFit().foregroundColor(Brand.primary.opacity(0.12))
                    .frame(width: 250, height: 250).accessibilityHidden(true)
                Button {
                    Task { do { try await tunnel.connect() } catch { message = error.localizedDescription } }
                } label: {
                    Image(systemName: "power").font(.system(size: 48, weight: .medium))
                        .foregroundColor(Brand.primary).frame(width: 140, height: 140)
                        .background(Brand.card).clipShape(Circle())
                        .overlay(Circle().stroke(Brand.primary.opacity(0.5), lineWidth: 2))
                }.accessibilityLabel("Подключить VPN — ядро пока недоступно")
            }
            Text("Ваше соединение — под вашим контролем")
                .font(.title2.bold()).multilineTextAlignment(.center)
            Text("Для подключения нужны аккаунт, доступный сервер и VPN-ядро.")
                .foregroundColor(.secondary).multilineTextAlignment(.center)
            panel {
                Label("Сервер не выбран", systemImage: "globe.europe.africa")
                Text("Пинг и статистика появятся после реального подключения.")
                    .font(.subheadline).foregroundColor(.secondary)
            }
        }.frame(maxWidth: .infinity)
    }
    private var serversView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Выберите локацию").font(.title2.bold())
            TextField("Поиск страны или города", text: $search).textFieldStyle(.roundedBorder)
            panel {
                Label("Список серверов пуст", systemImage: "network")
                Text("Backend пока не связан с VPN-инфраструктурой. Демонстрационные страны не выдаются за рабочие серверы.")
                    .foregroundColor(.secondary)
            }
        }
    }
    private var profileView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Ваш аккаунт").font(.title2.bold())
            panel {
                Label("Вы не авторизованы", systemImage: "person.crop.circle")
                Text("Регистрация и вход реализованы в API. Подключение мобильных форм и безопасного хранилища токенов — следующий этап.")
                    .foregroundColor(.secondary)
            }
            panel {
                Label("Устройства и подписка", systemImage: "iphone")
                Text("Без фиктивной подписки и оплаты. Статус появится после входа.").foregroundColor(.secondary)
            }
        }
    }
    private var settingsView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Настройки приложения").font(.title2.bold())
            panel {
                Label("Безопасность", systemImage: "lock.shield")
                Text("Kill Switch и защита DNS требуют интеграции Network Extension. Сейчас они не активны.")
                    .foregroundColor(.secondary)
            }
            DisclosureGroup("Расширенные настройки", isExpanded: $advanced) {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(["VLESS Reality", "Hysteria2", "Trojan", "Shadowsocks", "VMess", "SOCKS"], id: \.self) { name in
                        HStack { Text(name); Spacer(); Text("План").foregroundColor(.secondary) }
                    }
                    Text("Поддержка протоколов будет включаться только после проверки ядра. Разделение по приложениям на iOS не обещается для обычного consumer-приложения.")
                        .font(.footnote).foregroundColor(.secondary)
                }.padding(.top, 16)
            }.padding(20).background(Brand.card).cornerRadius(16)
            Text("Версия 0.1 • Основа разработки").foregroundColor(.secondary)
        }
    }
}
