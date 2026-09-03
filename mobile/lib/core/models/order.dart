enum OrderStage { pending, assigned, pickedUp, inTransit, delivered, failed }

extension OrderStageLabel on OrderStage {
  String get label => switch (this) {
    OrderStage.pending => 'Pending',
    OrderStage.assigned => 'Assigned',
    OrderStage.pickedUp => 'Picked up',
    OrderStage.inTransit => 'In transit',
    OrderStage.delivered => 'Delivered',
    OrderStage.failed => 'Failed',
  };

  String get apiValue => name == 'pickedUp'
      ? 'picked_up'
      : name == 'inTransit'
      ? 'in_transit'
      : name;
}

class StopAddress {
  const StopAddress({
    required this.addressLine,
    required this.city,
    this.region,
    this.postalCode,
    this.coordinates = const [],
  });
  final String addressLine;
  final String city;
  final String? region;
  final String? postalCode;
  final List<double> coordinates;

  factory StopAddress.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>?;
    return StopAddress(
      addressLine: json['addressLine'] as String? ?? 'Address unavailable',
      city: json['city'] as String? ?? '',
      region: json['region'] as String?,
      postalCode: json['postalCode'] as String?,
      coordinates: (location?['coordinates'] as List? ?? [])
          .map((value) => (value as num).toDouble())
          .toList(),
    );
  }
}

class DeliveryOrder {
  const DeliveryOrder({
    required this.id,
    required this.trackingNumber,
    required this.stage,
    required this.pickup,
    required this.dropoff,
    required this.weight,
    this.description,
    this.total = 0,
    this.currency = 'USD',
  });
  final String id;
  final String trackingNumber;
  final OrderStage stage;
  final StopAddress pickup;
  final StopAddress dropoff;
  final double weight;
  final String? description;
  final double total;
  final String currency;

  factory DeliveryOrder.fromJson(Map<String, dynamic> json) {
    final breakdown = json['priceBreakdown'] as Map<String, dynamic>? ?? {};
    return DeliveryOrder(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      trackingNumber: json['trackingNumber'] as String? ?? 'Unknown parcel',
      stage: OrderStage.values.firstWhere(
        (item) => item.apiValue == json['stage'],
        orElse: () => OrderStage.assigned,
      ),
      pickup: StopAddress.fromJson(
        (json['pickup'] as Map<String, dynamic>?) ?? const {},
      ),
      dropoff: StopAddress.fromJson(
        (json['dropoff'] as Map<String, dynamic>?) ?? const {},
      ),
      weight:
          ((json['package'] as Map<String, dynamic>?)?['weight'] as num?)
              ?.toDouble() ??
          0,
      description:
          (json['package'] as Map<String, dynamic>?)?['description'] as String?,
      total: (breakdown['total'] as num?)?.toDouble() ?? 0,
      currency: breakdown['currency'] as String? ?? 'USD',
    );
  }
}
