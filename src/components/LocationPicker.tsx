import { useApiQuery, queryKeys, type ApiResponse } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Branch {
  _id: string;
  name: string;
}

interface Way {
  _id: string;
  name: string;
  isDirectDelivery?: boolean;
  directDeliveryCharges?: number;
  branches: Branch[];
}

interface State {
  _id: string;
  name: string;
  isDirectDelivery: boolean;
  directDeliveryCharges?: number;
  ways: Way[];
}

export interface SelectedLocation {
  state?: string;
  stateName?: string;
  way?: string;
  wayName?: string;
  branch?: string;
  branchName?: string;
  address: string;
  isDirectDelivery?: boolean;
  directDeliveryCharges?: number;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: SelectedLocation) => void;
}

export default function LocationPicker({ visible, onClose, onSelect }: LocationPickerProps) {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedWay, setSelectedWay] = useState<Way | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [step, setStep] = useState<"state" | "way" | "branch">("state");
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardPadding(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardPadding(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { data: treeData, isLoading } = useApiQuery<ApiResponse<State[]>>({
    url: "locations/tree",
    queryKey: queryKeys.locations.tree(),
    enabled: visible,
  });

  const states = treeData?.data ?? [];

  const reset = () => {
    setSelectedState(null);
    setSelectedWay(null);
    setDeliveryAddress("");
    setStep("state");
  };

  const handleClose = () => {
    Keyboard.dismiss();
    reset();
    onClose();
  };

  const goBack = () => {
    if (selectedWay) {
      setSelectedWay(null);
      setDeliveryAddress("");
      return;
    }
    if (step === "way") { setStep("state"); setSelectedState(null); }
    else if (step === "branch") { setStep("way"); setSelectedWay(null); }
  };

  const handleSelectState = (s: State) => {
    setSelectedState(s);
    if (s.ways.length === 0) {
      if (s.isDirectDelivery) {
        setStep("way");
      } else {
        handleConfirmStateDirect(s);
      }
    } else if (s.ways.length === 1 && !s.isDirectDelivery) {
      setSelectedWay(s.ways[0]!);
      if (s.ways[0]!.branches.length === 0) {
        handleConfirm(s, s.ways[0]!, null, false, 0);
      } else if (s.ways[0]!.branches.length === 1) {
        handleConfirm(s, s.ways[0]!, s.ways[0]!.branches[0]!, false, 0);
      } else {
        setStep("branch");
      }
    } else {
      setStep("way");
    }
  };

  const handleSelectWay = (w: Way) => {
    setSelectedWay(w);
    if (w.branches.length === 0) {
      // No branches → confirm with the way (no branch needed)
      handleConfirm(selectedState!, w, null, false, 0);
    } else if (w.branches.length === 1 && !w.isDirectDelivery) {
      // Single branch, no direct delivery → auto-select it
      handleConfirm(selectedState!, w, w.branches[0]!, false, 0);
    } else {
      // Has branches (and possibly direct delivery) → show the combined view
      // (stay in "way" step with selectedWay set, showing both options)
    }
  };

  const handleSelectBranch = (b: Branch) => {
    handleConfirm(selectedState!, selectedWay!, b, false, 0);
  };

  const handleDirectConfirmForWay = () => {
    if (!selectedWay || !deliveryAddress.trim()) return;
    const charges = selectedWay.directDeliveryCharges ?? selectedState?.directDeliveryCharges ?? 0;
    handleConfirm(selectedState!, selectedWay, null, true, charges);
  };

  const handleDirectConfirmForState = () => {
    if (!deliveryAddress.trim()) return;
    const charges = selectedState?.directDeliveryCharges ?? 0;
    handleConfirm(selectedState!, null, null, true, charges);
  };

  const handleConfirmStateDirect = (s: State) => {
    onSelect({
      state: s._id,
      stateName: s.name,
      address: s.name,
      isDirectDelivery: false,
      directDeliveryCharges: 0,
    });
    reset();
  };

  const handleConfirm = (
    s: State, w: Way | null, b: Branch | null,
    isDirect: boolean, charges: number,
  ) => {
    const addressParts = [s.name];
    if (isDirect && deliveryAddress.trim()) {
      addressParts.push(deliveryAddress.trim());
    } else {
      if (w) addressParts.push(w.name);
      if (b) addressParts.push(b.name);
    }
    onSelect({
      state: s._id,
      stateName: s.name,
      way: w?._id,
      wayName: w?.name,
      branch: b?._id,
      branchName: b?.name,
      address: addressParts.join(" - "),
      isDirectDelivery: isDirect,
      directDeliveryCharges: charges,
    });
    Keyboard.dismiss();
    reset();
  };

  const showBack = step !== "state" || selectedWay !== null;

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: plate.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Math.max(40, keyboardPadding), maxHeight: "90%" }}>
            <ActivityIndicator size="large" color={plate.primary} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: plate.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Math.max(40, keyboardPadding), maxHeight: "90%" }}>
          <View style={gs.rowBetween}>
            <View style={gs.containerRow}>
              {showBack && (
                <TouchableOpacity onPress={goBack} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={22} color={plate.primary} />
                </TouchableOpacity>
              )}
              <Text style={gs.h2}>{t("cart.deliveryLocation")}</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={plate.text} />
            </TouchableOpacity>
          </View>

          {/* STEP: select a state */}
          {step === "state" && (
            <>
              <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>{t("cart.selectState")}</Text>
              <ScrollView>
                {states.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
                    onPress={() => handleSelectState(s)}
                  >
                    <Ionicons name="location-outline" size={20} color={plate.primary} />
                    <Text style={gs.label}>{s.name}</Text>
                    {s.isDirectDelivery && (
                      <Text style={[gs.caption, { color: plate.green, marginLeft: "auto" }]}>{t("cart.direct")}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* STEP: select a way (or show direct delivery + branches for a selected way) */}
          {step === "way" && selectedState && (
            <>
              {selectedWay ? (
                <>
                  {/* A specific way is selected — show its direct delivery + branches */}
                  {selectedWay.isDirectDelivery && (
                    <>
                      <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>
                        {t("cart.directDeliveryIn", { name: selectedWay.name })}
                      </Text>
                      <View style={[gs.inputContainer, { marginBottom: 12 }]}>
                        <TextInput
                          style={gs.input}
                          value={deliveryAddress}
                          onChangeText={setDeliveryAddress}
                          placeholder={t("cart.addressPlaceholder")}
                          placeholderTextColor={plate.graySecond}
                          autoFocus
                        />
                      </View>
                      <Text style={[gs.caption, { color: plate.green, marginBottom: 16 }]}>
                        {t("cart.directDeliveryCost", {
                          cost: (selectedWay.directDeliveryCharges ?? selectedState.directDeliveryCharges ?? 0).toLocaleString(),
                        })}
                      </Text>
                      <TouchableOpacity
                        style={[gs.button, { opacity: deliveryAddress.trim() ? 1 : 0.5 }]}
                        onPress={handleDirectConfirmForWay}
                        disabled={!deliveryAddress.trim()}
                      >
                        <Text style={gs.buttonText}>{t("cart.confirmAddress")}</Text>
                      </TouchableOpacity>
                      {selectedWay.branches.length > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16 }}>
                          <View style={{ flex: 1, height: 1, backgroundColor: plate.gray }} />
                          <Text style={[gs.caption, { marginHorizontal: 12, color: plate.textSecond }]}>OR</Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: plate.gray }} />
                        </View>
                      )}
                    </>
                  )}
                  {selectedWay.branches.length > 0 && (
                    <>
                      <Text style={[gs.label, { marginBottom: 8 }]}>
                        {t("cart.selectBranch", { name: selectedWay.name })}
                      </Text>
                      {!selectedWay.isDirectDelivery && (
                        <View style={{ backgroundColor: plate.backgroundSecond, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                          <Text style={[gs.caption, { color: plate.text }]}>{t("cart.companyCharges")}</Text>
                        </View>
                      )}
                      <ScrollView>
                        {selectedWay.branches.map((b) => (
                          <TouchableOpacity
                            key={b._id}
                            style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
                            onPress={() => handleSelectBranch(b)}
                          >
                            <Ionicons name="business-outline" size={20} color={plate.primary} />
                            <Text style={gs.label}>{b.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* No way selected yet — show state direct delivery + ways list */}
                  {selectedState.isDirectDelivery && (
                    <View style={[gs.cardFlat, { padding: 14, marginBottom: 12, borderColor: plate.green, borderWidth: 1 }]}>
                      <Text style={[gs.label, { marginBottom: 8 }]}>{t("cart.directDelivery")}</Text>
                      <Text style={[gs.caption, { color: plate.green, marginBottom: 8 }]}>
                        {t("cart.directDeliveryCost", {
                          cost: (selectedState.directDeliveryCharges ?? 0).toLocaleString(),
                        })}
                      </Text>
                      <View style={[gs.inputContainer, { marginBottom: 8 }]}>
                        <TextInput
                          style={gs.input}
                          value={deliveryAddress}
                          onChangeText={setDeliveryAddress}
                          placeholder={t("cart.addressPlaceholder")}
                          placeholderTextColor={plate.graySecond}
                        />
                      </View>
                      <TouchableOpacity
                        style={[gs.buttonSmall, { opacity: deliveryAddress.trim() ? 1 : 0.5 }]}
                        onPress={handleDirectConfirmForState}
                        disabled={!deliveryAddress.trim()}
                      >
                        <Text style={[gs.buttonText, { fontSize: 13 }]}>{t("cart.confirmAddress")}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={[gs.label, { marginTop: selectedState.isDirectDelivery ? 0 : 16, marginBottom: 8 }]}>
                    {t("cart.selectWay", { name: selectedState.name })}
                  </Text>
                  <ScrollView>
                    {selectedState.ways.map((w) => (
                      <TouchableOpacity
                        key={w._id}
                        style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
                        onPress={() => handleSelectWay(w)}
                      >
                        <Ionicons name="car-outline" size={20} color={plate.primary} />
                        <Text style={gs.label}>{w.name}</Text>
                        {w.isDirectDelivery && (
                          <Text style={[gs.caption, { color: plate.green, marginLeft: "auto" }]}>{t("cart.direct")}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </>
          )}

          {/* STEP: select a branch (only when way has no direct delivery) */}
          {step === "branch" && selectedWay && (
            <>
              <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>{t("cart.selectBranch", { name: selectedWay.name })}</Text>
              <View style={{ backgroundColor: plate.backgroundSecond, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <Text style={[gs.caption, { color: plate.text }]}>{t("cart.companyCharges")}</Text>
              </View>
              <ScrollView>
                {selectedWay.branches.map((b) => (
                  <TouchableOpacity
                    key={b._id}
                    style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
                    onPress={() => handleSelectBranch(b)}
                  >
                    <Ionicons name="business-outline" size={20} color={plate.primary} />
                    <Text style={gs.label}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
