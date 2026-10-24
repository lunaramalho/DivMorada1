import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HouseOnboardingTab } from '../types';

type Props = { tab: HouseOnboardingTab; onChangeTab: (tab: HouseOnboardingTab) => void };

export function HouseOnboardingTabs({ tab, onChangeTab }: Props) {
  return (
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tabBtn, tab === 'join' && styles.tabBtnActive]}
        onPress={() => onChangeTab('join')}
      >
        <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>
          Entrar em uma Casa
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabBtn, tab === 'create' && styles.tabBtnActive]}
        onPress={() => onChangeTab('create')}
      >
        <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>
          Criar Nova Casa
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row', width: '100%',
    backgroundColor: '#e8f8f5', borderRadius: 12,
    padding: 4, marginBottom: 20,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#1abc9c' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#fff' },
});
