import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'features/auth/login_screen.dart';
import 'features/orders/manifest_screen.dart';
import 'providers.dart';

void main() => runApp(const ProviderScope(child: RoutecraftApp()));

class RoutecraftApp extends StatelessWidget {
  const RoutecraftApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Routecraft Driver',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xff0b5c58),
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: const Color(0xfff4f6f3),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
    ),
    home: const _SessionGate(),
  );
}

class _SessionGate extends ConsumerWidget {
  const _SessionGate();
  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      ref.watch(authenticatedProvider)
      ? const ManifestScreen()
      : const LoginScreen();
}
