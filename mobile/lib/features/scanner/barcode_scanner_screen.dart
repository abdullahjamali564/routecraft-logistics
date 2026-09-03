import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/models/order.dart';
import '../../providers.dart';

class BarcodeScannerScreen extends ConsumerStatefulWidget {
  const BarcodeScannerScreen({
    super.key,
    required this.order,
    required this.action,
  });
  final DeliveryOrder order;
  final String action;
  @override
  ConsumerState<BarcodeScannerScreen> createState() =>
      _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends ConsumerState<BarcodeScannerScreen> {
  final controller = MobileScannerController();
  bool verifying = false;
  String? error;

  Future<void> _verify(String value) async {
    if (verifying || value.trim().isEmpty) return;
    setState(() {
      verifying = true;
      error = null;
    });
    await controller.stop();
    try {
      await ref
          .read(orderRepositoryProvider)
          .verifyBarcode(widget.order.id, value.trim(), action: widget.action);
      if (mounted) Navigator.pop(context, true);
    } catch (exception) {
      if (!mounted) return;
      setState(() {
        verifying = false;
        error =
            'This parcel could not be verified. Check the label and try again.';
      });
      await controller.start();
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('Scan ${widget.action}')),
    body: Stack(
      children: [
        MobileScanner(
          controller: controller,
          onDetect: (capture) {
            final value = capture.barcodes.firstOrNull?.rawValue;
            if (value != null) _verify(value);
          },
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            color: Colors.black87,
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Scan ${widget.order.trackingNumber}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      error!,
                      style: const TextStyle(color: Colors.amber),
                    ),
                  ),
                if (verifying)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
              ],
            ),
          ),
        ),
      ],
    ),
  );

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
