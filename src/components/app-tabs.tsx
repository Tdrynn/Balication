import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelVisibilityMode='unlabeled'>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label/>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label/>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/bookmark.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="wishlist">
        <NativeTabs.Trigger.Label/>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/heart.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="chatbot">
        <NativeTabs.Trigger.Label/>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/chatbox.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label/>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/profile.png')}
          renderingMode='template'
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
