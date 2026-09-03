import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';

import '../../core/models/order.dart';
import '../../providers.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProofDeliveryScreen extends ConsumerStatefulWidget {
  const ProofDeliveryScreen({super.key, required this.order});
  final DeliveryOrder order;
  @override
  ConsumerState<ProofDeliveryScreen> createState() =>
      _ProofDeliveryScreenState();
}

class _ProofDeliveryScreenState extends ConsumerState<ProofDeliveryScreen> {
  final signature = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
  );
  Uint8List? photo;
  bool saving = false;
  Future<void> _takePhoto() async {
    final result = await ImagePicker().pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (result != null) {
      final bytes = await result.readAsBytes();
      if (mounted) setState(() => photo = bytes);
    }
  }

  Future<void> _deliver() async {
    if (signature.isEmpty && photo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add a signature or confirmation photo first.'),
        ),
      );
      return;
    }
    setState(() => saving = true);
    try {
      await ref
          .read(manifestProvider.notifier)
          .setStage(widget.order, OrderStage.delivered);
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        setState(() => saving = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Proof of delivery')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          widget.order.trackingNumber,
          style: Theme.of(context).textTheme.titleLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        const Text(
          'Recipient signature',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Container(
          height: 220,
          decoration: BoxDecoration(color: Colors.white, border: Border.all()),
          child: Signature(
            controller: signature,
            backgroundColor: Colors.white,
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: signature.clear,
            child: const Text('Clear'),
          ),
        ),
        OutlinedButton.icon(
          onPressed: _takePhoto,
          icon: const Icon(Icons.camera_alt_outlined),
          label: Text(photo == null ? 'Add confirmation photo' : 'Photo added'),
        ),
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: saving ? null : _deliver,
          icon: const Icon(Icons.check),
          label: Text(saving ? 'Marking delivered...' : 'Mark as delivered'),
        ),
      ],
    ),
  );
  @override
  void dispose() {
    signature.dispose();
    super.dispose();
  }
}
