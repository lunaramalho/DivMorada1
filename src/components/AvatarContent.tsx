import { useState } from 'react';
import { Image, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { storedPhotoUrl } from './storedPhoto';

type Props = {
  photoUri?: string | null;
  initial: string;
  textStyle: StyleProp<TextStyle>;
};

export function AvatarContent(props: Props) {
  // A new photo gets its own loading state, including after a previous failure.
  const photoUri = storedPhotoUrl(props.photoUri);
  return <AvatarPhoto key={photoUri ?? ''} {...props} photoUri={photoUri} />;
}

function AvatarPhoto({ photoUri, initial, textStyle }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      {(!loaded || failed) && <Text style={textStyle}>{initial}</Text>}
      {photoUri && !failed ? (
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFill}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </>
  );
}
