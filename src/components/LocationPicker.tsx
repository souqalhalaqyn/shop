import { useApiQuery, queryKeys, type ApiResponse } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Way {
  _id: string;
  name: string;
  deliveryCompany: string;
}

interface Region {
  _id: string;
  name: string;
  isDirectDelivery: boolean;
  ways: Way[];
}

interface State {
  _id: string;
  name: string;
  regions: Region[];
}

export interface SelectedLocation {
  state?: string;
  stateName?: string;
  region?: string;
  regionName?: string;
  way?: string;
  wayName?: string;
  address: string;
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
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [directAddress, setDirectAddress] = useState("");
  const [step, setStep] = useState<"state" | "region" | "way" | "address">("state");

  const { data: treeData, isLoading } = useApiQuery<ApiResponse<State[]>>({
    url: "locations/tree",
    queryKey: queryKeys.locations.tree(),
    enabled: visible,
  });

  const states = treeData?.data ?? [];

  const reset = () => {
    setSelectedState(null);
    setSelectedRegion(null);
    setDirectAddress("");
    setStep("state");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const goBack = () => {
    if (step === "region") { setStep("state"); setSelectedState(null); }
    else if (step === "way") { setStep("region"); setSelectedRegion(null); }
    else if (step === "address") { setStep("region"); setSelectedRegion(null); }
  };

  const handleSelectState = (s: State) => {
    setSelectedState(s);
    if (s.regions.length === 1) {
      setSelectedRegion(s.regions[0]!);
      if (s.regions[0]!.ways.length === 1 && !s.regions[0]!.isDirectDelivery) {
        handleConfirm(s, s.regions[0]!, s.regions[0]!.ways[0]!, "");
      } else if (s.regions[0]!.isDirectDelivery) {
        setStep("address");
      } else {
        setStep("way");
      }
    } else {
      setStep("region");
    }
  };

  const handleSelectRegion = (r: Region) => {
    setSelectedRegion(r);
    if (r.isDirectDelivery) {
      setStep("address");
    } else if (r.ways.length === 1) {
      handleConfirm(selectedState!, r, r.ways[0]!, "");
    } else {
      setStep("way");
    }
  };

  const handleSelectWay = (w: Way) => {
    handleConfirm(selectedState!, selectedRegion!, w, "");
  };

  const handleConfirm = (
    s: State,
    r: Region,
    w: Way | null,
    addr: string,
  ) => {
    onSelect({
      state: s._id,
      stateName: s.name,
      region: r._id,
      regionName: r.name,
      way: w?._id,
      wayName: w?.name,
      address: addr || (w ? `${w.deliveryCompany} - ${w.name}` : ""),
    });
    reset();
  };

  const handleDirectAddress = () => {
    if (!directAddress.trim()) return;
    handleConfirm(selectedState!, selectedRegion!, null, directAddress.trim());
  };

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: plate.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            <ActivityIndicator size="large" color={plate.primary} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: plate.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "80%" }}>
          <View style={gs.rowBetween}>
            <View style={gs.containerRow}>
              {step !== "state" && (
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
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {step === "region" && selectedState && (
            <>
              <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>{t("cart.selectRegion", { name: selectedState.name })}</Text>
              <ScrollView>
                {selectedState.regions.map((r) => (
                  <TouchableOpacity
                    key={r._id}
                    style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
                    onPress={() => handleSelectRegion(r)}
                  >
                    <Ionicons name="map-outline" size={20} color={plate.primary} />
                    <Text style={gs.label}>{r.name}</Text>
                    {r.isDirectDelivery && (
                      <Text style={[gs.caption, { color: plate.green, marginLeft: "auto" }]}>{t("cart.direct")}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {step === "way" && selectedRegion && (
            <>
              <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>{t("cart.selectWay", { name: selectedRegion.name })}</Text>
              <ScrollView>
                {selectedRegion.ways.map((w) => (
                  <TouchableOpacity
                    key={w._id}
                    style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
                    onPress={() => handleSelectWay(w)}
                  >
                    <Ionicons name="car-outline" size={20} color={plate.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={gs.label}>{w.name}</Text>
                      <Text style={gs.caption}>{w.deliveryCompany}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {step === "address" && selectedRegion && (
            <>
              <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>
                {t("cart.enterAddress", { name: selectedRegion.name })}
              </Text>
              <View style={[gs.inputContainer, { marginTop: 6 }]}>
                <TextInput
                  style={gs.input}
                  value={directAddress}
                  onChangeText={setDirectAddress}
                  placeholder={t("cart.addressPlaceholder")}
                  placeholderTextColor={plate.graySecond}
                  multiline
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[gs.button, { marginTop: 16, opacity: directAddress.trim() ? 1 : 0.5 }]}
                onPress={handleDirectAddress}
                disabled={!directAddress.trim()}
              >
                <Text style={gs.buttonText}>{t("cart.confirmAddress")}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}