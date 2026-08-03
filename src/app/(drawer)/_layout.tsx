import { getApiClient } from "@/api";
import HeaderTitle from "@/components/HeaderTitle";
import { ADMIN_PHONE_NUMBER, FACEBOOK_URL, INSTAGRAM_URL, WHATSAPP_GROUP_URL } from "@/config/constants";
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
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function DrawerLayout() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    getApiClient().get("app-versions").then((res) => {
      const url = res.data?.data?.shop?.url;
      if (url) setAppUrl(url);
    }).catch(() => {});
  }, []);

  const handleShareApp = () => {
    if (!appUrl) return;
    const msg = t("sharing.shareApp", { url: appUrl });
    Share.share({ message: msg }).catch(() => {
      Alert.alert("", t("bucket.failedWhatsApp"));
    });
  };

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
                  <Text style={[gs.label, { fontSize: 16 }]}>{user.name ?? user.phone}</Text>
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
            <TouchableOpacity
              style={[gs.containerRow, { gap: 12, paddingVertical: 12 }]}
              onPress={() => Linking.openURL(FACEBOOK_URL).catch(() => {})}
            >
              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              <Text style={[gs.label, { color: plate.text, fontSize: 16 }]}>
                {t("navigation.facebook")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[gs.containerRow, { gap: 12, paddingVertical: 12 }]}
              onPress={() => Linking.openURL(INSTAGRAM_URL).catch(() => {})}
            >
              <Ionicons name="logo-instagram" size={22} color="#E4405F" />
              <Text style={[gs.label, { color: plate.text, fontSize: 16 }]}>
                {t("navigation.instagram")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[gs.containerRow, { gap: 12, paddingVertical: 12 }]}
              onPress={() => Linking.openURL(WHATSAPP_GROUP_URL).catch(() => {})}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text style={[gs.label, { color: plate.text, fontSize: 16 }]}>
                {t("navigation.whatsappGroup")}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: plate.gray, paddingTop: 16, marginTop: 16 }}>
            <TouchableOpacity
              style={[gs.containerRow, { gap: 12, paddingVertical: 12 }]}
              onPress={handleShareApp}
            >
              <Ionicons name="share-social-outline" size={22} color="#25D366" />
              <Text style={[gs.label, { color: plate.text, fontSize: 16 }]}>
                {t("navigation.shareApp")}
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
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="offers"
        options={{
          drawerLabel: t("navigation.offers"),
          title: t("navigation.offers"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "pricetags" : "pricetags-outline"} size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="ads"
        options={{
          drawerLabel: t("navigation.ads"),
          title: t("navigation.ads"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "megaphone" : "megaphone-outline"} size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="shops"
        options={{
          drawerLabel: t("navigation.shops"),
          title: t("navigation.shops"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "storefront" : "storefront-outline"} size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: t("navigation.settings"),
          title: t("navigation.settings"),
          drawerIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
