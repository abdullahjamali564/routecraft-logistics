import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api/api_client.dart';
import 'core/models/order.dart';
import 'core/storage/token_storage.dart';
import 'features/auth/auth_repository.dart';
import 'features/earnings/shift_repository.dart';
import 'features/navigation/location_service.dart';
import 'features/orders/order_repository.dart';

final tokenStorageProvider = Provider((ref) => TokenStorage());
final apiClientProvider = Provider((ref) => ApiClient(ref.watch(tokenStorageProvider)));
final authRepositoryProvider = Provider((ref) => AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStorageProvider)));
final authenticatedProvider = NotifierProvider<AuthenticatedNotifier, bool>(AuthenticatedNotifier.new);

class AuthenticatedNotifier extends Notifier<bool> {
  @override
  bool build() => false;
}
final orderRepositoryProvider = Provider((ref) => OrderRepository(ref.watch(apiClientProvider)));
final shiftRepositoryProvider = Provider((ref) => ShiftRepository(ref.watch(apiClientProvider)));
final locationServiceProvider = Provider((ref) => LocationService(ref.watch(apiClientProvider)));

final manifestProvider = AsyncNotifierProvider<ManifestNotifier, List<DeliveryOrder>>(ManifestNotifier.new);
class ManifestNotifier extends AsyncNotifier<List<DeliveryOrder>> {
  @override
  Future<List<DeliveryOrder>> build() => ref.watch(orderRepositoryProvider).activeManifest();
  Future<void> reload() async { state = const AsyncLoading(); state = await AsyncValue.guard(() => ref.read(orderRepositoryProvider).activeManifest()); }
  Future<void> setStage(DeliveryOrder order, OrderStage stage) async {
    final updated = await ref.read(orderRepositoryProvider).updateStage(order.id, stage);
    state = AsyncData([for (final item in state.value ?? <DeliveryOrder>[]) if (item.id == updated.id) updated else item]);
  }
}

final shiftOnlineProvider = NotifierProvider<ShiftOnlineNotifier, bool>(ShiftOnlineNotifier.new);
class ShiftOnlineNotifier extends Notifier<bool> {
  @override bool build() => false;
  Future<void> setOnline(bool online) async {
    if (online) {
      await ref.read(locationServiceProvider).start();
    } else {
      ref.read(locationServiceProvider).stop();
    }
    state = online;
  }
}

final shiftSummaryProvider = FutureProvider((ref) => ref.watch(shiftRepositoryProvider).summary());
