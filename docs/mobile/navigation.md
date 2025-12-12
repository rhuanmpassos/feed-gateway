# 🗺️ Navegação

> Estrutura de navegação do app

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   RootNavigator (Stack)                                     │
│   ├── SplashScreen                                          │
│   ├── OnboardingNavigator (Stack)                           │
│   │   ├── OnboardingWelcome                                 │
│   │   ├── OnboardingCategories                              │
│   │   └── OnboardingNotifications                           │
│   │                                                         │
│   └── MainNavigator (Bottom Tabs)                           │
│       ├── ParaVocêStack                                     │
│       │   ├── FeedScreen                                    │
│       │   └── ArticleScreen                                 │
│       ├── AgoraStack                                        │
│       │   ├── ChronologicalFeed                             │
│       │   └── ArticleScreen                                 │
│       ├── SalvosStack                                       │
│       │   ├── BookmarksScreen                               │
│       │   └── ArticleScreen                                 │
│       └── PerfilStack                                       │
│           ├── ProfileScreen                                 │
│           ├── InterestsScreen                               │
│           ├── NotificationsSettingsScreen                   │
│           └── ThemeSettingsScreen                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuração

### Dependências

```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

### Root Navigator

```typescript
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isLoading, isFirstLaunch, isLoggedIn } = useAppState();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Main Navigator (Tabs)

```typescript
// src/navigation/MainNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0B',
          borderTopWidth: 0,
          height: 82,
          paddingBottom: 34, // Safe area
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#636366',
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="ParaVoce"
        component={ParaVoceStack}
        options={{
          tabBarLabel: 'Para Você',
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
        }}
      />
      <Tab.Screen
        name="Agora"
        component={AgoraStack}
        options={{
          tabBarLabel: 'Agora',
          tabBarIcon: ({ color }) => <Icon name="zap" color={color} />,
        }}
      />
      <Tab.Screen
        name="Salvos"
        component={SalvosStack}
        options={{
          tabBarLabel: 'Salvos',
          tabBarIcon: ({ color }) => <Icon name="bookmark" color={color} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilStack}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Icon name="user" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

---

## Tab Stacks

### Para Você Stack

```typescript
// src/navigation/stacks/ParaVoceStack.tsx
const Stack = createNativeStackNavigator();

export function ParaVoceStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen
        name="Article"
        component={ArticleScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
```

### Agora Stack

```typescript
export function AgoraStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chronological" component={ChronologicalFeedScreen} />
      <Stack.Screen
        name="Article"
        component={ArticleScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
```

### Salvos Stack

```typescript
export function SalvosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
      <Stack.Screen
        name="Article"
        component={ArticleScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
```

### Perfil Stack

```typescript
export function PerfilStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0A0A0B' },
        headerTintColor: '#FFFFFF',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Interests"
        component={InterestsScreen}
        options={{ title: 'Seus Interesses' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationsSettingsScreen}
        options={{ title: 'Notificações' }}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeSettingsScreen}
        options={{ title: 'Tema' }}
      />
    </Stack.Navigator>
  );
}
```

---

## Onboarding Navigator

```typescript
// src/navigation/OnboardingNavigator.tsx
const Stack = createNativeStackNavigator();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="Categories" component={OnboardingCategoriesScreen} />
      <Stack.Screen name="Notifications" component={OnboardingNotificationsScreen} />
    </Stack.Navigator>
  );
}
```

---

## Types

```typescript
// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Categories: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  ParaVoce: NavigatorScreenParams<FeedStackParamList>;
  Agora: NavigatorScreenParams<FeedStackParamList>;
  Salvos: NavigatorScreenParams<BookmarksStackParamList>;
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

export type FeedStackParamList = {
  Feed: undefined;
  Chronological?: undefined;
  Article: { articleId: string; articleUrl: string };
};

export type BookmarksStackParamList = {
  Bookmarks: undefined;
  Article: { articleId: string; articleUrl: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Interests: undefined;
  NotificationSettings: undefined;
  ThemeSettings: undefined;
};
```

---

## Deep Linking

```typescript
// src/navigation/linking.ts
const linking = {
  prefixes: ['newsapp://', 'https://newsapp.com'],
  config: {
    screens: {
      Main: {
        screens: {
          ParaVoce: {
            screens: {
              Article: 'article/:articleId',
            },
          },
        },
      },
    },
  },
};

// Uso no NavigationContainer
<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

---

## Navegação Programática

```typescript
// Hook tipado
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type FeedNavigationProp = NativeStackNavigationProp<FeedStackParamList>;

export function useFeedNavigation() {
  return useNavigation<FeedNavigationProp>();
}

// Uso
const navigation = useFeedNavigation();

// Navegar para artigo
navigation.navigate('Article', {
  articleId: article.id,
  articleUrl: article.url,
});

// Voltar
navigation.goBack();

// Reset para Main após onboarding
navigation.reset({
  index: 0,
  routes: [{ name: 'Main' }],
});
```

---

## Animações de Transição

```typescript
// Slide horizontal (padrão)
{
  animation: 'slide_from_right',
}

// Modal de baixo para cima
{
  presentation: 'fullScreenModal',
  animation: 'slide_from_bottom',
}

// Fade (sutil)
{
  animation: 'fade',
}

// Custom com Reanimated
import { TransitionPresets } from '@react-navigation/native-stack';

screenOptions={{
  ...TransitionPresets.SlideFromRightIOS,
}}
```


