import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/guardian/skeleton/shimmer-block';
import { GuardianColors } from '@/constants/theme';

function MenuRowSkeleton({ isLast }: { isLast?: boolean }) {
  return (
    <View style={[styles.menuRow, !isLast && styles.menuRowBorder]}>
      <ShimmerBlock style={styles.menuIcon} />
      <View style={styles.menuMeta}>
        <ShimmerBlock style={styles.menuLabel} />
        <ShimmerBlock style={styles.menuHint} />
      </View>
      <ShimmerBlock style={styles.chevron} />
    </View>
  );
}

function MenuGroupSkeleton({ rows }: { rows: number }) {
  return (
    <View style={styles.menuGroup}>
      <ShimmerBlock style={styles.groupTitle} />
      <View style={styles.menuCard}>
        {Array.from({ length: rows }).map((_, index) => (
          <MenuRowSkeleton key={index} isLast={index === rows - 1} />
        ))}
      </View>
    </View>
  );
}

export function SettingsScreenSkeleton() {
  return (
    <View style={styles.wrap}>
      <View style={styles.profile}>
        <ShimmerBlock style={styles.avatar} />
        <ShimmerBlock style={styles.profileName} />
        <ShimmerBlock style={styles.profileEmail} />
        <ShimmerBlock style={styles.profileRole} />
      </View>

      <MenuGroupSkeleton rows={4} />
      <MenuGroupSkeleton rows={2} />
      <ShimmerBlock style={styles.logoutBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  profile: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
    gap: 10,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: 4,
  },
  profileName: {
    width: 160,
    height: 22,
    borderRadius: 11,
  },
  profileEmail: {
    width: 200,
    height: 14,
    borderRadius: 7,
  },
  profileRole: {
    width: 130,
    height: 28,
    borderRadius: 14,
  },
  menuGroup: {
    marginBottom: 22,
    gap: 10,
  },
  groupTitle: {
    width: 120,
    height: 18,
    borderRadius: 9,
    marginLeft: 2,
  },
  menuCard: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: GuardianColors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  menuMeta: {
    flex: 1,
    gap: 6,
  },
  menuLabel: {
    width: '45%',
    height: 16,
    borderRadius: 8,
  },
  menuHint: {
    width: '75%',
    height: 12,
    borderRadius: 6,
  },
  chevron: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  logoutBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    marginTop: 8,
  },
});
