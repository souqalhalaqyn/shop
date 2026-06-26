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
  branches: Branch[];
}

interface State {
  _id: string;
  name: string;
  isDirectDelivery: boolean;
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
  const [step, setStep] = useState<"state" | "way" | "branch">("state");

  const { data: treeData, isLoading } = useApiQuery<ApiResponse<State[]>>({
    url: "locations/tree",
    queryKey: queryKeys.locations.tree(),
    enabled: visible,
  });

  const states = treeData?.data ?? [];

  const reset = () => {
    setSelectedState(null);
    setSelectedWay(null);
    setStep("state");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const goBack = () => {
    if (step === "way") { setStep("state"); setSelectedState(null); }
    else if (step === "branch") { setStep("way"); setSelectedWay(null); }
  };

  const handleSelectState = (s: State) => {
    setSelectedState(s);
    if (s.ways.length === 0) {
      handleConfirm(s, null, null);
    } else if (s.ways.length === 1 && !s.isDirectDelivery) {
      setSelectedWay(s.ways[0]!);
      if (s.ways[0]!.branches.length === 0) {
        handleConfirm(s, s.ways[0]!, null);
      } else if (s.ways[0]!.branches.length === 1) {
        handleConfirm(s, s.ways[0]!, s.ways[0]!.branches[0]!);
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
      handleConfirm(selectedState!, w, null);
    } else if (w.branches.length === 1) {
      handleConfirm(selectedState!, w, w.branches[0]!);
    } else {
      setStep("branch");
    }
  };

  const handleSelectBranch = (b: Branch) => {
    handleConfirm(selectedState!, selectedWay!, b);
  };

  const handleConfirm = (s: State, w: Way | null, b: Branch | null) => {
    const parts = [s.name];
    if (w) parts.push(w.name);
    if (b) parts.push(b.name);
    onSelect({
      state: s._id,
      stateName: s.name,
      way: w?._id,
      wayName: w?.name,
      branch: b?._id,
      branchName: b?.name,
      address: parts.join(" - "),
    });
    reset();
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
        <View style={{ backgroundColor: plate.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: "80%" }}>
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
                    {s.isDirectDelivery && (
                      <Text style={[gs.caption, { color: plate.green, marginLeft: "auto" }]}>{t("cart.direct")}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {step === "way" && selectedState && (
            <>
              <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>{t("cart.selectWay", { name: selectedState.name })}</Text>
              <ScrollView>
                {selectedState.isDirectDelivery && (
                  <TouchableOpacity
                    style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10, borderColor: plate.green, borderWidth: 1 }]}
                    onPress={() => handleConfirm(selectedState, null, null)}
                  >
                    <Ionicons name="location-outline" size={20} color={plate.green} />
                    <Text style={gs.label}>{t("cart.directDelivery")}</Text>
                  </TouchableOpacity>
                )}
                {selectedState.ways.map((w) => (
                  <TouchableOpacity
                    key={w._id}
                    style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
                    onPress={() => handleSelectWay(w)}
                  >
                    <Ionicons name="car-outline" size={20} color={plate.primary} />
                    <Text style={gs.label}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {step === "branch" && selectedWay && (
            <>
              <Text style={[gs.label, { marginTop: 16, marginBottom: 8 }]}>{t("cart.selectBranch", { name: selectedWay.name })}</Text>
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
