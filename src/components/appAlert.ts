import { Alert, Platform } from 'react-native';

// Preserve native dialogs and their callbacks on platforms with browser dialogs.
export const appAlert: Pick<typeof Alert, 'alert'> = {
  alert(title, message, buttons, options) {
    if (Platform.OS !== 'web') { Alert.alert(title, message, buttons, options); return; }
    const text = [title, message].filter(Boolean).join('\n\n');
    const cancel = buttons?.find(button => button.style === 'cancel');
    const action = buttons?.find(button => button.style !== 'cancel');
    if (cancel && action) {
      if (window.confirm(text)) action.onPress?.();
      else cancel.onPress?.();
    } else {
      window.alert(text);
      action?.onPress?.();
    }
  },
};
