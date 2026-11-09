import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { storedPhotoUrl } from './storedPhoto';
import { protectedFileURL } from '@/services/protectedStorage';

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
  const [signedUri, setSignedUri] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (photoUri) protectedFileURL(photoUri).then(uri => { if (active) setSignedUri(uri); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [photoUri]);

  return (
    <>
      {(!loaded || failed) && <Text style={textStyle}>{initial}</Text>}
      {signedUri && !failed ? (
        <Image
          source={{ uri: signedUri }}
          style={StyleSheet.absoluteFill}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </>
  );
}
