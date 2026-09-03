import 'package:shared_preferences/shared_preferences.dart';

class TokenStorage {
  static const _accessTokenKey = 'routecraft_token';
  static const _refreshTokenKey = 'routecraft_refresh';

  Future<String?> readAccessToken() async =>
      (await SharedPreferences.getInstance()).getString(_accessTokenKey);
  Future<String?> readRefreshToken() async =>
      (await SharedPreferences.getInstance()).getString(_refreshTokenKey);

  Future<void> save({required String accessToken, String? refreshToken}) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_accessTokenKey, accessToken);
    if (refreshToken != null) {
      await preferences.setString(_refreshTokenKey, refreshToken);
    }
  }

  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_accessTokenKey);
    await preferences.remove(_refreshTokenKey);
  }
}
