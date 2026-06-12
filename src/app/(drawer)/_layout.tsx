import HeaderTitle from "@/components/HeaderTitle";
import { ADMIN_PHONE_NUMBER } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function DrawerLayout() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const handleCommunicate = () => {
    const phone = ADMIN_PHONE_NUMBER.replace(/^\+/, "");
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("", t("bucket.failedWhatsApp"));
    });
  };

  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView
          {...props}
          style={{ backgroundColor: plate.background }}
        >
          {isAuthenticated && user ? (
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: plate.gray, marginBottom: 8 }}>
              <View style={[gs.containerRow, { gap: 12 }]}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: plate.primary,
                  justifyContent: "center", alignItems: "center",
                }}>
                  <Ionicons name="person" size={24} color={plate.background} />
                </View>
                <View>
                  <Text style={[gs.label, { fontSize: 16 }]}>{user.phone}</Text>
                  <Text style={gs.caption}>{t("settings.account")}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: plate.gray, marginBottom: 8 }}>
              <TouchableOpacity
                style={[gs.button, { paddingVertical: 10 }]}
                onPress={() => router.push("/(auth)" as any)}
              >
                <Ionicons name="log-in-outline" size={18} color={plate.background} style={{ marginRight: 8 }} />
                <Text style={gs.buttonText}>{t("auth.loginSignup")}</Text>
              </TouchableOpacity>
            </View>
          )}

          <DrawerItemList {...props} />

          <View style={{ paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: plate.gray, marginTop: 16 }}>
            <TouchableOpacity
              style={[gs.containerRow, { gap: 12, paddingVertical: 12 }]}
              onPress={handleCommunicate}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text style={[gs.label, { color: plate.text, fontSize: 16 }]}>
                {t("navigation.communicateUs")}
              </Text>
            </TouchableOpacity>
          </View>
        </DrawerContentScrollView>
      )}
      screenOptions={{
        headerTitle: () => <HeaderTitle />,
        headerStyle: {
          backgroundColor: plate.backgroundSecond,
        },
        headerTintColor: plate.primary,

        drawerStyle: {
          backgroundColor: plate.background,
          width: width * 0.7,
        },
        drawerActiveBackgroundColor: plate.backgroundSecond,
        drawerActiveTintColor: plate.primary,
        drawerInactiveTintColor: plate.text,
        drawerLabelStyle: {
          marginLeft: 10,
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: t("navigation.home"),
          title: t("navigation.home"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="ads"
        options={{
          drawerLabel: t("navigation.ads"),
          title: t("navigation.ads"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "pricetag" : "pricetag-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="shops"
        options={{
          drawerLabel: t("navigation.shops"),
          title: t("navigation.shops"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "storefront" : "storefront-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: t("navigation.settings"),
          title: t("navigation.settings"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Drawer>
  );
}
