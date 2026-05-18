import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  title: string;
  right?: React.ReactNode;
};

export function SectionTitle({ title, right }: Props) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    ...Typography.section,
    color: GuardianColors.text,
  },
});
