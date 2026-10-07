import { Alert, Platform, type AlertButton } from 'react-native';

// React Native's Alert.alert does nothing in a web browser, which would make
// confirmations ("Cancel pickup?", "Sign out?") and error messages vanish on
// web. On web only, this routes them to the browser's own dialogs:
//   • 0–1 buttons → window.alert, then that button's action
//   • 2+ buttons  → window.confirm: OK runs the main (non-cancel) button,
//                   Cancel runs the cancel button
// Phones are untouched. Call once at app start-up.

let installed = false;

export function installWebAlert() {
  if (Platform.OS !== 'web' || installed) return;
  installed = true;

  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = message ? `${title}\n\n${message}` : title;
    const list = buttons ?? [];

    if (list.length <= 1) {
      window.alert(text);
      list[0]?.onPress?.();
      return;
    }

    const cancel = list.find((b) => b.style === 'cancel');
    // The action to confirm: prefer a destructive button, else the last non-cancel one.
    const main =
      list.find((b) => b.style === 'destructive') ?? [...list].reverse().find((b) => b.style !== 'cancel') ?? list[0];
    const label = main.text ? `\n\nOK = ${main.text}${cancel?.text ? `, Cancel = ${cancel.text}` : ''}` : '';

    if (window.confirm(text + label)) main.onPress?.();
    else cancel?.onPress?.();
  };
}
