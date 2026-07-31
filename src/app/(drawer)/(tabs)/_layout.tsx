import { useCart } from "@/context/CartContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

export default function TabsLayout() {
  const { plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: plate.backgroundSecond,
          borderTopColor: plate.gray,
        },
        tabBarActiveTintColor: plate.primary,
        tabBarInactiveTintColor: plate.graySecond,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: ({ focused, color }) =>
            focused ? <Text style={{ color }} numberOfLines={1}>{t("navigation.home")}</Text> : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          tabBarLabel: ({ focused, color }) =>
            focused ? <Text style={{ color }} numberOfLines={1}>{t("navigation.cart")}</Text> : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: ({ focused, color }) =>
            focused ? <Text style={{ color }} numberOfLines={1}>{t("navigation.orders")}</Text> : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bucket"
        options={{
          tabBarLabel: ({ focused, color }) =>
            focused ? <Text style={{ color }} numberOfLines={1}>{t("navigation.bucket")}</Text> : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "card" : "card-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="categories/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="containers/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="containers/[id]/comments"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="categories-all"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="location-picker"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
