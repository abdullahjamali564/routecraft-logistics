import '../../core/api/api_client.dart';

class ShiftSummary {
  const ShiftSummary({
    this.completed = 0,
    this.estimated = 0,
    this.currency = 'USD',
  });
  final int completed;
  final double estimated;
  final String currency;
}

class ShiftRepository {
  ShiftRepository(this._api);
  final ApiClient _api;

  Future<ShiftSummary> summary() async {
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '/drivers/earnings/today',
      );
      final data = response.data?['data'] as Map<String, dynamic>? ?? {};
      return ShiftSummary(
        completed: (data['completedDrops'] as num?)?.toInt() ?? 0,
        estimated: (data['estimatedEarnings'] as num?)?.toDouble() ?? 0,
        currency: data['currency'] as String? ?? 'USD',
      );
    } on Object {
      return const ShiftSummary();
    }
  }
}
