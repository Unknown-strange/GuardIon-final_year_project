import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { getChildAvatarSource } from '@/constants/child-avatars';
import { getChildCustomAvatarUri } from '@/utils/child-custom-avatars';

type Props = {
  childId: string;
  size?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  style?: ViewStyle;
  imageUri?: string | null;
};

export function ChildAvatar({
  childId,
  size = 56,
  borderRadius,
  borderWidth = 0,
  borderColor,
  style,
  imageUri,
}: Props) {
  const radius = borderRadius ?? size / 2;
  const [storedUri, setStoredUri] = useState<string | null>(null);

  useEffect(() => {
    if (imageUri) return;
    void getChildCustomAvatarUri(childId).then(setStoredUri);
  }, [childId, imageUri]);

  const resolvedUri = imageUri ?? storedUri;
  const source = resolvedUri ? { uri: resolvedUri } : getChildAvatarSource(childId);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth,
          borderColor,
        },
        style,
      ]}>
      <Image
        source={source}
        style={[styles.image, { borderRadius: radius }]}
        contentFit="cover"
        accessibilityLabel="Child photo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
