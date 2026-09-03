import '../../core/api/api_client.dart';
import '../../core/models/order.dart';

class OrderRepository {
  OrderRepository(this._api);
  final ApiClient _api;

  Future<List<DeliveryOrder>> activeManifest() async {
    final response = await _api.get<Map<String, dynamic>>('/orders');
    final data = response.data?['data'];
    if (data is! List) throw const ApiFailure('Invalid manifest response.');
    return data
        .map((item) => DeliveryOrder.fromJson(item as Map<String, dynamic>))
        .where(
          (order) =>
              !{OrderStage.delivered, OrderStage.failed}.contains(order.stage),
        )
        .toList();
  }

  Future<DeliveryOrder> updateStage(String orderId, OrderStage stage) async {
    final response = await _api.patch<Map<String, dynamic>>(
      '/orders/$orderId/stage',
      data: {'stage': stage.apiValue},
    );
    return DeliveryOrder.fromJson(
      response.data?['data'] as Map<String, dynamic>,
    );
  }

  Future<void> verifyBarcode(
    String orderId,
    String barcode, {
    required String action,
  }) async {
    await _api.post(
      '/orders/$orderId/scan',
      data: {'barcode': barcode, 'action': action},
    );
  }
}
