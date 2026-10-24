import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/styles/theme';

export function LoginHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>
        🏠 <Text style={{ color: COLORS.primary }}>DivMorada</Text>
      </Text>
      <Text style={styles.subtitle}>Entre na sua conta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: "bold" },
  subtitle: { color: "#888", fontSize: 16, marginTop: 10 },
});
