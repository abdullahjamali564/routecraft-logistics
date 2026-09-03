import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers.dart';

class ShiftScreen extends ConsumerWidget {
  const ShiftScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(shiftSummaryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Shift summary')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Today',
              style: Theme.of(context).textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            summary.when(
              loading: () => const CircularProgressIndicator(),
              error: (error, _) => Text(error.toString()),
              data: (value) => Row(
                children: [
                  Expanded(
                    child: _Metric(
                      label: 'Completed drops',
                      value: '${value.completed}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _Metric(
                      label: 'Estimated earnings',
                      value:
                          '${value.currency} ${value.estimated.toStringAsFixed(2)}',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    ),
  );
}
