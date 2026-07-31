import { getApiClient, queryKeys } from "@/api";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { usePrice } from "@/utils/price";
import { type SelectedLocation } from "@/components/LocationPicker";
import LocationPicker from "@/components/LocationPicker";
import { useGlobalStyles } from "@/styles/global";
import { APP_PREFIX } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RECENT_LOCATIONS_KEY = `${APP_PREFIX}:recentLocations`;

export default function CheckoutScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { items, clearCart } = useCart();
  const { toSYP, formatSYP } = usePrice();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const displayTotal = items.reduce((sum, i) => {
    return sum + toSYP(i.price * i.quantity, i.currency);
  }, 0);

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [saveNameToggle, setSaveNameToggle] = useState(!user?.name);

  const [phone, setPhone] = useState(user?.phone ?? "");

  const [recentLocations, setRecentLocations] = useState<SelectedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_LOCATIONS_KEY).then((stored) => {
      if (stored) {
        try {
          setRecentLocations(JSON.parse(stored));
        } catch {}
      }
    });
  }, []);

  const saveRecentLocation = useCallback(async (loc: SelectedLocation) => {
    setRecentLocations((prev) => {
      const filtered = prev.filter((l) => l.address !== loc.address);
      const next = [loc, ...filtered].slice(0, 3);
      AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleLocationPicked = (loc: SelectedLocation) => {
    setSelectedLocation(loc);
    saveRecentLocation(loc);
    setShowLocationPicker(false);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return fullName.trim().length > 0;
      case 1: return true;
      case 2: return !!selectedLocation?.address;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (step === 0 && saveNameToggle && fullName.trim() !== user?.name) {
      try {
        await getApiClient().put("auth/name", { name: fullName.trim() });
        await updateUser({ name: fullName.trim() } as Partial<AuthUser>);
      } catch {}
    }
    if (step === 2 && selectedLocation) {
      const charges = selectedLocation.directDeliveryCharges ?? 0;
      const isBranch = !!selectedLocation.branch;
      if (isBranch) {
        Alert.alert(t("cart.deliveryCharges"), t("cart.companyCharges"), [
          { text: t("common.ok"), onPress: () => setStep(3) },
        ]);
        return;
      } else if (selectedLocation.isDirectDelivery && charges > 0) {
        Alert.alert(t("cart.deliveryCharges"), t("cart.directDeliveryCost", { cost: charges.toLocaleString() }), [
          { text: t("common.ok"), onPress: () => setStep(3) },
        ]);
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleConfirm = async () => {
    if (!selectedLocation) return;
    setSubmitting(true);
    try {
      const client = getApiClient();
      const payload: Record<string, any> = {
        items: items.map((i) => ({
          containerId: i.containerId,
          productIndex: i.productIndex,
          quantity: i.quantity,
          color: i.color ?? "",
        })),
        location: selectedLocation.address,
        locationType: selectedLocation.branch ? "branch" : "direct",
        phone,
        name: fullName.trim(),
      };
      if (selectedLocation.state) payload.state = selectedLocation.state;
      if (selectedLocation.way) payload.way = selectedLocation.way;
      if (selectedLocation.branch) payload.branch = selectedLocation.branch;

      await client.post("orders", payload);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      clearCart();
      Alert.alert("", t("orders.placeSuccess"), [
        { text: "OK", onPress: () => router.replace("/(drawer)/(tabs)/orders") },
      ]);
    } catch (error: any) {
      Alert.alert("", error?.response?.data?.message || t("orders.placeFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: plate.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : router.back()} style={{ padding: 4 }}>
          <Text style={{ color: plate.primary, fontSize: 16 }}>{step > 0 ? t("common.back") : t("common.cancel")}</Text>
        </TouchableOpacity>
        <Text style={[gs.h3, { flex: 1, textAlign: "center", marginRight: 40 }]}>
          {t("checkout.title")}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 10, backgroundColor: plate.backgroundSecond }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: step === i ? 20 : 8, height: 8, borderRadius: 4,
              backgroundColor: i <= step ? plate.primary : plate.gray,
            }}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {step === 0 && (
          <>
            <Text style={[gs.h2, { marginBottom: 8 }]}>{t("checkout.nameTitle")}</Text>
            <Text style={[gs.textSmall, { marginBottom: 20 }]}>{t("checkout.nameSubtitle")}</Text>

            <View style={gs.inputContainer}>
              <TextInput
                style={gs.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t("checkout.namePlaceholder")}
                placeholderTextColor={plate.graySecond}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[gs.containerRow, { marginTop: 16 }]}
              onPress={() => setSaveNameToggle(!saveNameToggle)}
            >
              <View
                style={{
                  width: 20, height: 20, borderRadius: 4, borderWidth: 2,
                  borderColor: saveNameToggle ? plate.primary : plate.gray,
                  backgroundColor: saveNameToggle ? plate.primary : "transparent",
                  justifyContent: "center", alignItems: "center",
                }}
              >
                {saveNameToggle && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>}
              </View>
              <Text style={[gs.text, { marginLeft: 10, flex: 1 }]}>
                {t("checkout.saveName")}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[gs.h2, { marginBottom: 8 }]}>{t("checkout.phoneTitle")}</Text>
            <Text style={[gs.textSmall, { marginBottom: 20 }]}>{t("checkout.phoneSubtitle")}</Text>

            <View style={gs.inputContainer}>
              <TextInput
                style={gs.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder={t("checkout.phonePlaceholder")}
                placeholderTextColor={plate.graySecond}
              />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[gs.h2, { marginBottom: 8 }]}>{t("checkout.locationTitle")}</Text>
            <Text style={[gs.textSmall, { marginBottom: 20 }]}>{t("checkout.locationSubtitle")}</Text>

            {recentLocations.map((loc, i) => {
              const sel = selectedLocation?.address === loc.address;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    gs.cardFlat, {
                      padding: 14, marginBottom: 10,
                      borderWidth: sel ? 2 : 1,
                      borderColor: sel ? plate.primary : plate.gray,
                    },
                  ]}
                  onPress={() => setSelectedLocation(loc)}
                >
                  <View style={gs.containerRow}>
                    <View
                      style={{
                        width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                        borderColor: sel ? plate.primary : plate.gray,
                        justifyContent: "center", alignItems: "center",
                      }}
                    >
                      {sel && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: plate.primary }} />}
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={gs.label}>{loc.address}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setRecentLocations((prev) => {
                          const next = prev.filter((_, idx) => idx !== i);
                          AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
                          return next;
                        });
                        if (sel) setSelectedLocation(null);
                      }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="close-circle" size={20} color={plate.red ?? "#ef4444"} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[gs.buttonOutline, { marginTop: recentLocations.length > 0 ? 4 : 0 }]}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={gs.buttonTextSecondary}>
                {t("checkout.newLocation")}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[gs.h2, { marginBottom: 20 }]}>{t("checkout.confirmTitle")}</Text>

            <View style={[gs.card, { padding: 16 }]}>
              <Text style={[gs.label, { color: plate.textSecond, marginBottom: 4 }]}>{t("checkout.name")}</Text>
              <Text style={gs.textBold}>{fullName.trim()}</Text>
            </View>

            <View style={[gs.card, { padding: 16 }]}>
              <Text style={[gs.label, { color: plate.textSecond, marginBottom: 4 }]}>{t("checkout.phone")}</Text>
              <Text style={gs.textBold}>{phone}</Text>
            </View>

            <View style={[gs.card, { padding: 16 }]}>
              <Text style={[gs.label, { color: plate.textSecond, marginBottom: 4 }]}>{t("checkout.location")}</Text>
              <Text style={gs.textBold}>{selectedLocation?.address}</Text>
            </View>

            <View style={[gs.card, { padding: 16 }]}>
              <Text style={[gs.label, { color: plate.textSecond, marginBottom: 4 }]}>{t("checkout.total")}</Text>
              <Text style={[gs.h1, { color: plate.primary }]}>
                {displayTotal.toLocaleString()} SYP
              </Text>
            </View>

            {items.map((item, i) => (
              <View key={i} style={[gs.containerRow, { padding: 10, backgroundColor: plate.backgroundSecond, borderRadius: 8, marginBottom: 6 }]}>
                <Text style={[gs.text, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                <Text style={gs.caption}>x{item.quantity}</Text>
                <Text style={[gs.textBold, { color: plate.primary, marginLeft: 8 }]}>
                  {formatSYP(item.price * item.quantity, item.currency)}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[gs.button, { marginTop: 24, opacity: submitting ? 0.6 : 1 }]}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={plate.background} />
              ) : (
                <Text style={gs.buttonText}>
                  {t("checkout.confirmOrder")} ({displayTotal.toLocaleString()} SYP)
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {step < 3 && (
        <View style={{ padding: 16, backgroundColor: plate.backgroundSecond, borderTopWidth: 1, borderTopColor: plate.gray }}>
          <TouchableOpacity
            style={[gs.button, { opacity: canProceed() ? 1 : 0.5 }]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={gs.buttonText}>{t("checkout.next")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationPicked}
      />
    </KeyboardAvoidingView>
  );
}
