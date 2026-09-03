import 'package:dio/dio.dart';

import '../storage/token_storage.dart';

class ApiFailure implements Exception {
  const ApiFailure(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(this._storage, {String? baseUrl}) {
    dio = Dio(
      BaseOptions(
        baseUrl:
            baseUrl ??
            const String.fromEnvironment(
              'API_URL',
              defaultValue: 'http://10.0.2.2:4000/api/v1',
            ),
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Accept': 'application/json'},
      ),
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.readAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              error.requestOptions.extra['skipAuth'] != true &&
              !error.requestOptions.extra['retried']) {
            final refresh = await _storage.readRefreshToken();
            if (refresh != null) {
              try {
                final response = await dio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refresh},
                  options: Options(extra: {'skipAuth': true}),
                );
                final data = response.data['data'] as Map<String, dynamic>;
                await _storage.save(
                  accessToken: data['token'] as String,
                  refreshToken: data['refreshToken'] as String?,
                );
                final request = error.requestOptions..extra['retried'] = true;
                request.headers['Authorization'] = 'Bearer ${data['token']}';
                handler.resolve(await dio.fetch(request));
                return;
              } catch (_) {
                await _storage.clear();
              }
            }
          }
          handler.reject(error);
        },
      ),
    );
  }

  late final Dio dio;
  final TokenStorage _storage;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) => dio.get<T>(path, queryParameters: queryParameters);
  Future<Response<T>> post<T>(String path, {Object? data}) =>
      dio.post<T>(path, data: data);
  Future<Response<T>> patch<T>(String path, {Object? data}) =>
      dio.patch<T>(path, data: data);

  static ApiFailure failure(Object error) {
    if (error is DioException) {
      final response = error.response;
      final body = response?.data;
      final message = body is Map && body['error'] is Map
          ? (body['error']['message'] as String? ?? 'Request failed')
          : 'Unable to reach the service';
      return ApiFailure(message, statusCode: response?.statusCode);
    }
    return ApiFailure(error.toString());
  }
}
