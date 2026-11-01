import * as Haptics from 'expo-haptics';

export function errorHaptic() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {

    });
}