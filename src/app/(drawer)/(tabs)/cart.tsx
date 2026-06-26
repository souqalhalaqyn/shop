import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiClient, queryKeys, useApiQuery, type ApiResponse } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import { type SelectedLocation } from "@/components/LocationPicker";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Location {
  name: string;
  address: string;
  state?: string;
  region?: string;
  way?: string;
}

interface LocationData {
  locations: Location[];
  defaultLocation: string;
}

export default function CartScreen() {
  const { gs, plate } = useGlobalStyles();
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { convert } = useExchangeRate();
  const [showPurchase, setShowPurchase] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: locData, isLoading: locLoading } = useApiQuery<ApiResponse<LocationData>>({
    url: "auth/locations",
    queryKey: queryKeys.auth.locations(),
    enabled: showPurchase,
  });

  const locations = locData?.data?.locations ?? [];
  const defaultLocation = locData?.data?.defaultLocation ?? "";

  const [selectedLocation, setSelectedLocation] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [saveName, setSaveName] = useState("");
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLastLocationPrompt, setShowLastLocationPrompt] = useState(false);

  const [pendingLocation, setPendingLocation] = useState<SelectedLocation | null>(null);
  const [lastLocation, setLastLocation] = useState<SelectedLocation | null>(null);

  const { loc: locParam } = useLocalSearchParams<{ loc?: string }>();
  useEffect(() => {
    if (locParam) {
      try {
        const parsed = JSON.parse(locParam) as SelectedLocation;
        setPendingLocation(parsed);
        setCustomAddress(parsed.address);
        setSelectedLocation("");
        router.setParams({ loc: undefined });
      } catch { /* ignore */ }
    }
  }, [locParam]);

  const LAST_LOCATION_KEY = "@barbers-shop:lastLocation";

  const openPurchase = async () => {
    if (!isAuthenticated) {
      router.push("/(auth)");
      return;
    }
    setSelectedLocation(defaultLocation);
    setCustomAddress("");
    const stored = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SelectedLocation;
        setLastLocation(parsed);
        setShowLastLocationPrompt(true);
      } catch { /* ignore */ }
    }
    setShowPurchase(true);
  };

  const handleLocationPicked = async (loc: SelectedLocation) => {
    setPendingLocation(loc);
    setCustomAddress(loc.address);
    setShowSavePrompt(false);
    setSelectedLocation("");
  };

  const handleSaveNewLocation = async () => {
    if (!saveName.trim() || !customAddress.trim()) return;
    try {
      const client = getApiClient();
      await client.post("auth/locations", {
        name: saveName.trim(),
        address: customAddress.trim(),
        state: pendingLocation?.state,
        way: pendingLocation?.way,
        branch: pendingLocation?.branch,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.locations() });
      setSelectedLocation(saveName.trim());
      setShowSavePrompt(false);
      setSaveName("");
    } catch (error: any) {
      Alert.alert("", error?.response?.data?.message || t("orders.placeFailed"));
    }
  };

  const handlePurchase = async () => {
    let address = "";
    let locationType = "direct";
    let state: string | undefined;
    let way: string | undefined;
    let branch: string | undefined;

    if (pendingLocation) {
      address = pendingLocation.address;
      locationType = pendingLocation.branch ? "branch" : "direct";
      state = pendingLocation.state;
      way = pendingLocation.way;
      branch = pendingLocation.branch;
    } else if (selectedLocation) {
      const loc = locations.find((l) => l.name === selectedLocation);
      address = loc?.address ?? "";
      state = loc?.state;
      way = loc?.way;
      branch = (loc as any)?.branch;
      if (branch) locationType = "branch";
    } else {
      address = customAddress.trim();
    }

    if (!address) {
      Alert.alert("", t("cart.deliveryAddress"));
      return;
    }

    setSubmitting(true);
    try {
      const client = getApiClient();
      const payload: Record<string, any> = {
        items: items.map((i) => ({
          containerId: i.containerId,
          productIndex: i.productIndex,
          quantity: i.quantity,
        })),
        location: address,
        locationType,
      };
      if (state) payload.state = state;
      if (way) payload.way = way;
      if (branch) payload.branch = branch;
      await client.post("orders", payload);
      if (pendingLocation) {
        await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(pendingLocation));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      clearCart();
      setShowPurchase(false);
      Alert.alert("", t("orders.placeSuccess"), [
        { text: "OK", onPress: () => router.push("/(drawer)/(tabs)/orders") },
      ]);
    } catch (error: any) {
      Alert.alert("", error?.response?.data?.message || t("orders.placeFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[gs.cardFlat, { padding: 12, marginBottom: 10, flexDirection: "row", gap: 12 }]}>
      <Image
        source={{ uri: buildImageUrl(item.image) }}
        style={{ width: 64, height: 64, borderRadius: 8 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={gs.label} numberOfLines={1}>{item.name}</Text>
        <Text style={[gs.caption, { color: plate.primary, marginTop: 2 }]}>{convert(item.price)} SYP</Text>
        <View style={[gs.containerRow, { marginTop: 6, gap: 0 }]}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.containerId, item.productIndex, item.quantity - 1)}
            style={{ padding: 4 }}
          >
            <Ionicons name="remove-circle" size={24} color={plate.primary} />
          </TouchableOpacity>
          <Text style={[gs.textBold, { marginHorizontal: 12, minWidth: 24, textAlign: "center" }]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.containerId, item.productIndex, item.quantity + 1)}
            style={{ padding: 4 }}
          >
            <Ionicons name="add-circle" size={24} color={plate.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.containerId, item.productIndex)}>
        <Ionicons name="trash-outline" size={20} color={plate.red} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={gs.container}>
      {items.length === 0 ? (
        <View style={[gs.centered, { flex: 1 }]}>
          <Ionicons name="cart-outline" size={64} color={plate.graySecond} />
          <Text style={[gs.h2, { marginTop: 16 }]}>{t("cart.empty")}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => `${i.containerId}-${i.productIndex}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
          />

          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: plate.backgroundSecond,
              borderTopWidth: 1,
              borderTopColor: plate.gray,
            }}
          >
            <View style={gs.rowBetween}>
              <Text style={gs.h2}>{t("cart.total")}: {convert(total).toLocaleString()} SYP</Text>
              <TouchableOpacity style={gs.button} onPress={openPurchase}>
                <Text style={gs.buttonText}>{t("cart.purchase")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <Modal visible={showPurchase} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: plate.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              maxHeight: "90%",
            }}
          >
            <View style={gs.rowBetween}>
              <Text style={gs.h2}>{t("cart.deliveryAddress")}</Text>
              <TouchableOpacity onPress={() => router.push("/(drawer)/(tabs)/location-picker")}>
                <Text style={{ color: plate.primary }}>{t("cart.browseLocations")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            {lastLocation && showLastLocationPrompt ? (
              <View style={[gs.cardFlat, { padding: 12, marginTop: 16, borderWidth: 1, borderColor: plate.primary }]}>
                <Text style={[gs.label, { marginBottom: 4 }]}>{t("cart.lastLocation")}</Text>
                <Text style={gs.caption}>{lastLocation.address}</Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[gs.buttonOutline, { flex: 1 }]}
                    onPress={() => { setShowLastLocationPrompt(false); setLastLocation(null); }}
                  >
                    <Text style={gs.buttonTextSecondary}>{t("common.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[gs.button, { flex: 1 }]}
                    onPress={() => {
                      setPendingLocation(lastLocation);
                      setCustomAddress(lastLocation.address);
                      setShowLastLocationPrompt(false);
                    }}
                  >
                    <Text style={gs.buttonText}>{t("cart.useLastLocation")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : locLoading ? (
              <ActivityIndicator size="small" color={plate.primary} style={{ marginTop: 20 }} />
            ) : (
              <>
                {locations.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    {locations.map((loc) => {
                      const isDefault = loc.name === defaultLocation;
                      const isSelected = loc.name === selectedLocation;
                      return (
                        <TouchableOpacity
                          key={loc.name}
                          style={[
                            gs.cardFlat,
                            {
                              padding: 12,
                              marginBottom: 8,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              borderWidth: isSelected ? 2 : 1,
                              borderColor: isSelected ? plate.primary : plate.gray,
                            },
                          ]}
                          onPress={() => {
                            setSelectedLocation(loc.name);
                            setCustomAddress("");
                          }}
                        >
                          <Ionicons
                            name={isSelected ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={plate.primary}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={gs.label}>
                              {loc.name}
                              {isDefault ? ` (${t("cart.default")})` : ""}
                            </Text>
                            <Text style={gs.caption}>{loc.address}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                  <TouchableOpacity
                    style={[gs.buttonDanger, { flex: 1 }]}
                    onPress={() => setShowPurchase(false)}
                  >
                    <Text style={gs.buttonText}>{t("common.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[gs.button, { flex: 2, opacity: submitting ? 0.6 : 1 }]}
                    onPress={handlePurchase}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color={plate.background} />
                    ) : (
                      <Text style={gs.buttonText}>{t("cart.confirmPurchase")} ({convert(total).toLocaleString()} SYP)</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSavePrompt} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 32 }}>
          <View style={{ backgroundColor: plate.background, borderRadius: 16, padding: 24 }}>
            <Text style={gs.h2}>{t("cart.saveAddress")}</Text>
            <Text style={[gs.textSmall, { marginTop: 8 }]}>
              {t("cart.saveAddressHint")}
            </Text>
            <View style={[gs.inputContainer, { marginTop: 12 }]}>
              <TextInput
                style={gs.input}
                value={saveName}
                onChangeText={setSaveName}
                placeholder={t("cart.locationNamePlaceholder")}
                placeholderTextColor={plate.graySecond}
                autoFocus
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[gs.buttonOutline, { flex: 1 }]}
                onPress={() => { setShowSavePrompt(false); setSaveName(""); }}
              >
                <Text style={gs.buttonTextSecondary}>{t("cart.skip")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[gs.button, { flex: 1 }]}
                onPress={handleSaveNewLocation}
              >
                <Text style={gs.buttonText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}