import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/theme";
import { Input } from "@/components/Input";
import { authService, getApiErrorMessage } from "@/services/api";
import { session } from "@/services/session";
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atencao", "Informe email e senha.");
      return;
    }

    setLoading(true);
    try {
      await authService.login(email.trim(), senha);
      router.replace(session.getResidencia() ? "/(tabs)" : "/join-house");
    } catch (error: any) {
      Alert.alert(
        "Erro ao fazer login",
        getApiErrorMessage(error, "Erro ao tentar fazer login."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* LOGO */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            🏠 <Text style={{ color: COLORS.primary }}>DivMorada</Text>
          </Text>
          <Text style={styles.subtitle}>Entre na sua conta</Text>
        </View>

        {/* GOOGLE BUTTON */}
        {/* <TouchableOpacity style={styles.googleBtn}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
            }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleBtnText}>Continuar com Google</Text>
        </TouchableOpacity> */}

        {/* DIVIDER */}
        {/* <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.line} />
        </View> */}

        {/* FORM */}
        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Senha"
          placeholder="........"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!showPassword}
          rightElement={
            <TouchableOpacity
              onPress={() => setShowPassword(prev => !prev)}
              style={styles.passwordToggle}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#777"
              />
            </TouchableOpacity>
          }
        />

        {/* LOGIN BUTTON */}
        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.mainBtn, loading && styles.mainBtnDisabled]}
          disabled={loading}
        >
          <Text style={styles.mainBtnText}>{loading ? "Entrando..." : "Entrar"}</Text>
        </TouchableOpacity>

        {/* FOOTER — navega para o cadastro */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: "bold" },
  subtitle: { color: "#888", fontSize: 16, marginTop: 10 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 30,
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleBtnText: { fontSize: 16, fontWeight: "500", color: "#333" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  line: { flex: 1, height: 1, backgroundColor: "#eee" },
  dividerText: { marginHorizontal: 15, color: "#999", fontSize: 12 },

  mainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 20,
  },
  mainBtnDisabled: { opacity: 0.7 },
  mainBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  passwordToggle: { paddingLeft: 10, paddingVertical: 10 },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: "#888", fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: "bold", fontSize: 14 },
});
