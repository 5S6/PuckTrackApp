import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import ScoreScreen from './src/screens/index';
import TeamScreen from './src/screens/team';
import StatsScreen from './src/screens/stats';
import ScheduleScreen from './src/screens/schedule';
import SettingsScreen from './src/screens/settings';

const Tab = createBottomTabNavigator();
type TabIconName = 'score' | 'team' | 'stats' | 'schedule' | 'settings';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#070810',
    card: '#0D0F1A',
    border: 'rgba(255,255,255,0.08)',
  },
};

function TabIcon({
  name,
  color,
  focused,
}: {
  name: TabIconName;
  color: string;
  focused: boolean;
}) {
  const size = focused ? 27 : 25;
  const strokeWidth = focused ? 2.6 : 2.3;
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (name) {
    case 'score':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...common} d="M4.5 15.5h15" />
          <Path {...common} d="M8.5 11.5h7" />
          <Path {...common} d="M10 7.5h4" />
          <Circle cx="12" cy="18.3" r="2.2" fill={color} />
        </Svg>
      );
    case 'team':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...common} d="M12 3.5l7 3v5.1c0 4.2-2.8 7.2-7 8.9-4.2-1.7-7-4.7-7-8.9V6.5l7-3z" />
          <Path {...common} d="M8.8 12.2l2.2 2.2 4.6-5" />
        </Svg>
      );
    case 'stats':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect {...common} x="4.5" y="11" width="3.5" height="8" rx="1" />
          <Rect {...common} x="10.3" y="6" width="3.5" height="13" rx="1" />
          <Rect {...common} x="16.1" y="9" width="3.5" height="10" rx="1" />
        </Svg>
      );
    case 'schedule':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect {...common} x="4" y="5.5" width="16" height="14" rx="2.3" />
          <Line {...common} x1="8" y1="3.8" x2="8" y2="7.2" />
          <Line {...common} x1="16" y1="3.8" x2="16" y2="7.2" />
          <Line {...common} x1="4" y1="10" x2="20" y2="10" />
          <Path {...common} d="M8.2 14h.1M12 14h.1M15.8 14h.1" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle {...common} cx="12" cy="12" r="3.1" />
          <Path {...common} d="M12 3.5v2M12 18.5v2M5.95 5.95l1.4 1.4M16.65 16.65l1.4 1.4M3.5 12h2M18.5 12h2M5.95 18.05l1.4-1.4M16.65 7.35l1.4-1.4" />
        </Svg>
      );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#070810" />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#0D0F1A',
              borderTopColor: 'rgba(255,255,255,0.08)',
              borderTopWidth: 1,
              elevation: 0,
              height: 70,
              paddingTop: 8,
              paddingBottom: 8,
            },
            tabBarActiveTintColor: '#FFFFFF',
            tabBarInactiveTintColor: 'rgba(255,255,255,0.48)',
            tabBarIconStyle: {
              marginTop: 2,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0,
              marginBottom: 2,
            },
          }}
        >
          <Tab.Screen
            name="Score"
            component={ScoreScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="score" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="My Team"
            component={TeamScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="team" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="stats" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Schedule"
            component={ScheduleScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="schedule" color={color} focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="settings" color={color} focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
