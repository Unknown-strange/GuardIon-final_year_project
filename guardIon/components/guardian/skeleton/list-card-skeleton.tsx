import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/guardian/skeleton/shimmer-block';
import { GuardianColors, Layout } from '@/constants/theme';

export type ListCardSkeletonVariant =
  | 'guardian'
  | 'child-managed'
  | 'child-summary'
  | 'contact'
  | 'invite';

type Props = {
  variant: ListCardSkeletonVariant;
};

function Circle({ size }: { size: number }) {
  return <ShimmerBlock style={{ width: size, height: size, borderRadius: size / 2 }} />;
}

function Line({ width, height = 14 }: { width: `${number}%` | number; height?: number }) {
  return <ShimmerBlock style={{ width, height, borderRadius: height / 2 }} />;
}

export function ListCardSkeleton({ variant }: Props) {
  if (variant === 'child-summary') {
    return (
      <View style={styles.summaryCard}>
        <ShimmerBlock style={styles.summaryAccent} />
        <View style={styles.summaryBody}>
          <View style={styles.summaryRow}>
            <Circle size={56} />
            <View style={styles.summaryMeta}>
              <View style={styles.nameRow}>
                <Line width="55%" height={18} />
                <ShimmerBlock style={styles.badge} />
              </View>
              <Line width="40%" height={12} />
              <Line width="75%" height={14} />
              <Line width="50%" height={12} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'invite') {
    return (
      <View style={styles.inviteCard}>
        <Circle size={44} />
        <View style={styles.inviteMeta}>
          <Line width="45%" height={10} />
          <Line width="60%" height={18} />
          <Line width="85%" height={14} />
          <ShimmerBlock style={styles.inviteButton} />
        </View>
      </View>
    );
  }

  if (variant === 'contact') {
    return (
      <View style={styles.contactCard}>
        <View style={styles.contactTop}>
          <Circle size={48} />
          <View style={styles.flexMeta}>
            <Line width="50%" height={16} />
            <Line width="35%" height={12} />
            <Line width="65%" height={14} />
          </View>
          <ShimmerBlock style={styles.callBtn} />
        </View>
        <View style={styles.divider} />
        <View style={styles.contactFooter}>
          <ShimmerBlock style={styles.footerBtn} />
          <ShimmerBlock style={styles.footerBtn} />
        </View>
      </View>
    );
  }

  const avatarSize = variant === 'child-managed' ? 64 : 52;

  return (
    <View style={styles.card}>
      <Circle size={avatarSize} />
      <View style={styles.flexMeta}>
        {variant === 'guardian' ? <ShimmerBlock style={styles.rolePill} /> : null}
        <Line width="55%" height={variant === 'child-managed' ? 17 : 16} />
        <Line width={variant === 'guardian' ? '70%' : '40%'} height={14} />
        {variant === 'child-managed' ? <ShimmerBlock style={styles.statusPill} /> : null}
        {variant === 'guardian' ? <Line width="80%" height={12} /> : null}
      </View>
      {variant === 'guardian' ? <ShimmerBlock style={styles.menuIcon} /> : null}
      {variant === 'child-managed' ? (
        <View style={styles.actionCol}>
          <ShimmerBlock style={styles.actionIcon} />
          <ShimmerBlock style={styles.actionIcon} />
        </View>
      ) : null}
    </View>
  );
}

export function ListCardSkeletonList({
  variant,
  count = 3,
}: {
  variant: ListCardSkeletonVariant;
  count?: number;
}) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <ListCardSkeleton key={`${variant}-${index}`} variant={variant} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  flexMeta: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  rolePill: {
    width: 120,
    height: 22,
    borderRadius: 11,
    alignSelf: 'flex-start',
  },
  statusPill: {
    width: 72,
    height: 24,
    borderRadius: 12,
    marginTop: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  actionCol: {
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  summaryAccent: {
    width: 4,
    borderRadius: 0,
  },
  summaryBody: {
    flex: 1,
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryMeta: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    width: 56,
    height: 22,
    borderRadius: 11,
  },
  inviteCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    padding: 16,
    marginBottom: 12,
  },
  inviteMeta: {
    flex: 1,
    gap: 6,
  },
  inviteButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    marginTop: 8,
  },
  contactCard: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    padding: 14,
    gap: 12,
  },
  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  divider: {
    height: 1,
    backgroundColor: GuardianColors.border,
  },
  contactFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
  },
});
