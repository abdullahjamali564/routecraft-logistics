import 'dart:async';

import 'package:geolocator/geolocator.dart';

import '../../core/api/api_client.dart';

class LocationService {
  LocationService(this._api);
  final ApiClient _api;
  Timer? _timer;
  bool _busy = false;

  Future<void> start() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) throw const ApiFailure('Location services are disabled.');
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw const ApiFailure('Location permission is required while online.');
    }
    await sendNow();
    _timer ??= Timer.periodic(const Duration(seconds: 30), (_) => sendNow());
  }

  Future<void> sendNow() async {
    if (_busy) return;
    _busy = true;
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      await _api.post(
        '/drivers/location',
        data: {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'capturedAt': DateTime.now().toUtc().toIso8601String(),
        },
      );
    } finally {
      _busy = false;
    }
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  void dispose() => stop();
}
