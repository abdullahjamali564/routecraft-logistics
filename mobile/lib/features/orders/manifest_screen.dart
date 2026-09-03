import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/order.dart';
import '../../providers.dart';
import '../earnings/shift_screen.dart';
import '../scanner/barcode_scanner_screen.dart';
import '../pod/proof_delivery_screen.dart';

class ManifestScreen extends ConsumerWidget {
  const ManifestScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final manifest = ref.watch(manifestProvider);
    final online = ref.watch(shiftOnlineProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Today\'s run sheet'),
        actions: [
          IconButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ShiftScreen()),
            ),
            icon: const Icon(Icons.insights_outlined),
            tooltip: 'Shift and earnings',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(manifestProvider.notifier).reload(),
        child: manifest.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _ErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(manifestProvider),
          ),
          data: (orders) => CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: _DutyBanner(
                  online: online,
                  onChanged: (value) async {
                    try {
                      await ref
                          .read(shiftOnlineProvider.notifier)
                          .setOnline(value);
                    } catch (error) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(error.toString())),
                        );
                      }
                    }
                  },
                ),
              ),
              if (orders.isEmpty)
                const SliverFillRemaining(
                  child: Center(child: Text('No active stops assigned.')),
                )
              else
                SliverList.builder(
                  itemCount: orders.length,
                  itemBuilder: (context, index) =>
                      _OrderTile(order: orders[index]),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DutyBanner extends StatelessWidget {
  const _DutyBanner({required this.online, required this.onChanged});
  final bool online;
  final ValueChanged<bool> onChanged;
  @override
  Widget build(BuildContext context) => Container(
    color: online ? const Color(0xffd7efe5) : const Color(0xffe6e9e7),
    padding: const EdgeInsets.fromLTRB(20, 16, 12, 16),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                online ? 'You are online' : 'You are offline',
                style: Theme.of(context).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              Text(
                online
                    ? 'Location telemetry is active'
                    : 'Go online to start your route',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        Switch(value: online, onChanged: onChanged),
      ],
    ),
  );
}

class _OrderTile extends ConsumerWidget {
  const _OrderTile({required this.order});
  final DeliveryOrder order;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPickup = order.stage == OrderStage.assigned;
    final address = isPickup ? order.pickup : order.dropoff;
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: isPickup
                      ? const Color(0xfff5cf72)
                      : const Color(0xffb9d9ec),
                  child: Icon(
                    isPickup
                        ? Icons.inventory_2_outlined
                        : Icons.location_on_outlined,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isPickup ? 'PICKUP' : 'DROP-OFF',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Text(
                        order.trackingNumber,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                Chip(label: Text(order.stage.label)),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              address.addressLine,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            Text(
              [address.city, address.region, address.postalCode]
                  .whereType<String>()
                  .where((value) => value.isNotEmpty)
                  .join(', '),
            ),
            if (order.description != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '${order.description} • ${order.weight.toStringAsFixed(1)} kg',
                ),
              ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => BarcodeScannerScreen(
                        order: order,
                        action: isPickup ? 'pickup' : 'dropoff',
                      ),
                    ),
                  ),
                  icon: const Icon(Icons.qr_code_scanner),
                  label: Text(isPickup ? 'Scan pickup' : 'Scan drop-off'),
                ),
                if (order.stage == OrderStage.inTransit) ...[
                  const SizedBox(width: 8),
                  FilledButton.icon(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ProofDeliveryScreen(order: order),
                      ),
                    ),
                    icon: const Icon(Icons.verified_outlined),
                    label: const Text('Proof'),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off, size: 48),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton(onPressed: onRetry, child: const Text('Try again')),
        ],
      ),
    ),
  );
}
