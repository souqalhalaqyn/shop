import { getApiClient, queryKeys, useApiQuery, type ApiResponse } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import LocationPicker, { type SelectedLocation } from "@/components/LocationPicker";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
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

  const [showPurchase, setShowPurchase] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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

  const [pendingLocation, setPendingLocation] = useState<SelectedLocation | null>(null);

  const openPurchase = () => {
    if (!isAuthenticated) {
      router.push("/(auth)");
      return;
    }
    setSelectedLocation(defaultLocation);
    setCustomAddress("");
    setShowPurchase(true);
  };

  const handleLocationPicked = async (loc: SelectedLocation) => {
    setPendingLocation(loc);
    setCustomAddress(loc.address);
    setShowLocationPicker(false);
    setShowSavePrompt(true);
  };

  const handleSaveNewLocation = async () => {
    if (!saveName.trim() || !customAddress.trim()) return;
    try {
      const client = getApiClient();
      await client.post("auth/locations", {
        name: saveName.trim(),
        address: customAddress.trim(),
        state: pendingLocation?.state,
        region: pendingLocation?.region,
        way: pendingLocation?.way,
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
    const address = selectedLocation
      ? locations.find((l) => l.name === selectedLocation)?.address ?? ""
      : customAddress.trim();

    if (!address) {
      Alert.alert("", t("cart.deliveryAddress"));
      return;
    }

    setSubmitting(true);
    try {
      const client = getApiClient();
      const payload = {
        items: items.map((i) => ({
          containerId: i.containerId,
          productIndex: i.productIndex,
          quantity: i.quantity,
        })),
        location: address,
      };
      await client.post("orders", payload);
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
        <Text style={[gs.caption, { color: plate.primary, marginTop: 2 }]}>{(item as any).priceSY ?? item.price} SYP</Text>
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
              <Text style={gs.h2}>{t("cart.total")}: {total.toLocaleString()} SYP</Text>
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
              maxHeight: "80%",
            }}
          >
            <View style={gs.rowBetween}>
              <Text style={gs.h2}>{t("cart.deliveryAddress")}</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(true)}>
                <Text style={{ color: plate.primary }}>{t("cart.browseLocations")}</Text>
              </TouchableOpacity>
            </View>

            {locLoading ? (
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

                <Text style={[gs.label, { marginTop: 16 }]}>
                  {t("cart.orEnterAddress")}
                </Text>
                <View style={[gs.inputContainer, { marginTop: 6 }]}>
                  <TextInput
                    style={gs.input}
                    value={customAddress}
                    onChangeText={(v) => {
                      setCustomAddress(v);
                      if (v.trim()) setSelectedLocation("");
                    }}
                    placeholder={t("cart.addressPlaceholder")}
                    placeholderTextColor={plate.graySecond}
                    multiline
                  />
                </View>

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
                      <Text style={gs.buttonText}>{t("cart.confirmPurchase")} ({total.toLocaleString()} SYP)</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationPicked}
      />

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