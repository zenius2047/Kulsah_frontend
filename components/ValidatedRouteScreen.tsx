import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../src/types/user.types';
import { validateRouteParams } from '../src/utils/routeValidation';
import { PRIMARY_COLOR, useThemeMode } from '../theme';

type BoundaryProps = {
  route: { params?: unknown };
  navigation: { canGoBack: () => boolean; goBack: () => void; navigate: (name: 'MainTabs') => void };
};

export const withValidatedRoute = <Name extends keyof RootStackParamList, Props extends object>(
  routeName: Name,
  Component: React.ComponentType<Props>,
) => {
  const ValidatedRoute: React.FC<BoundaryProps & Props> = (props) => {
    const { route, navigation } = props;
    const { theme } = useThemeMode();
    const validation = validateRouteParams(routeName, route.params);
    if (validation.valid) return React.createElement(Component, props);

    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>This destination is unavailable</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{validation.message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    );
  };
  ValidatedRoute.displayName = `Validated(${String(routeName)})`;
  return ValidatedRoute;
};

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { fontSize: 20, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  body: { marginTop: 10, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: { marginTop: 22, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: PRIMARY_COLOR },
  buttonText: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
});
