import { StyleSheet, Text, View } from 'react-native';
import type { ResumoFinanceiro } from '@/services/api';

type Props = { summary: ResumoFinanceiro };

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function FinancialSummaryCard({ summary }: Props) {
  const saldoColor =
    summary.saldoLiquido > 0
      ? styles.balancePositive
      : summary.saldoLiquido < 0
        ? styles.balanceNegative
        : styles.balanceNeutral;
  const saldoPrefix =
    summary.saldoLiquido > 0 ? '+ ' : summary.saldoLiquido < 0 ? '- ' : '';

  return (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>Seu Saldo Liquido</Text>
      <Text style={[
        styles.balanceValue,
        saldoColor,
      ]}>
        {saldoPrefix}
        {formatCurrency(Math.abs(summary.saldoLiquido))}
      </Text>
      <View style={styles.divider} />
      <View style={styles.row}>
        <View style={styles.infoBox}>
          <View style={[styles.dot, { backgroundColor: '#ff4d4d' }]} />
          <Text style={styles.subValue}>- {formatCurrency(summary.voceDeve)}</Text>
          <Text style={styles.subLabel}>Voce deve</Text>
        </View>
        <View style={styles.infoBox}>
          <View style={[styles.dot, { backgroundColor: '#2ecc71' }]} />
          <Text style={styles.subValue}>+ {formatCurrency(summary.teDevem)}</Text>
          <Text style={styles.subLabel}>Te devem</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  balanceLabel: { color: '#7f8c8d', fontSize: 16 },
  balanceValue: { fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
  balancePositive: { color: '#1abc9c' },
  balanceNegative: { color: '#e74c3c' },
  balanceNeutral: { color: '#7f8c8d' },
  divider: { height: 1, backgroundColor: '#ecf0f1', width: '100%', marginVertical: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  infoBox: { alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 5 },
  subValue: { fontWeight: 'bold', fontSize: 16 },
  subLabel: { color: '#7f8c8d', fontSize: 12 },
});
