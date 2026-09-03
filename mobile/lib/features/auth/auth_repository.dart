import '../../core/api/api_client.dart';
import '../../core/storage/token_storage.dart';

class AuthRepository {
  AuthRepository(this._api, this._storage);
  final ApiClient _api;
  final TokenStorage _storage;

  Future<void> login(String email, String password) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data?['data'] as Map<String, dynamic>?;
    final token = data?['token'] as String?;
    if (token == null || token.isEmpty) {
      throw const ApiFailure('Login response did not include a token.');
    }
    await _storage.save(
      accessToken: token,
      refreshToken: data?['refreshToken'] as String?,
    );
  }

  Future<bool> hasSession() async =>
      (await _storage.readAccessToken())?.isNotEmpty ?? false;
  Future<void> logout() => _storage.clear();
}
