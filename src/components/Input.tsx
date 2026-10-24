// src/components/Input.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../styles/theme';

interface Props extends TextInputProps {
  label: string;
  rightElement?: React.ReactNode;
}

export const Input = ({ label, rightElement, ...rest }: Props) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <TextInput
        style={styles.input}
        placeholderTextColor="#999"
        {...rest}
      />
      {rightElement}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 15 },
  label: { fontWeight: 'bold', marginBottom: 8, color: COLORS.textMain, fontSize: 16 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
});
