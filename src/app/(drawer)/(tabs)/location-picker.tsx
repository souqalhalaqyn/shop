import { useApiQuery, queryKeys, type ApiResponse } from "@/api";
import { useGlobalStyles } from "@/styles/global";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
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
  branches: Branch[];
}

interface State {
  _id: string;
  name: string;
  isDirectDelivery: boolean;
  ways: Way[];
}

interface SelectedLocation {
  state?: string;
  stateName?: string;
  way?: string;
  wayName?: string;
  branch?: string;
  branchName?: string;
  address: string;
}

export default function LocationPickerScreen() {
  const { gs, plate } = useGlobalStyles();
  const { t } = useTranslation();
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedWay, setSelectedWay] = useState<Way | null>(null);
  const [directAddress, setDirectAddress] = useState("");
  const [step, setStep] = useState<"state" | "way" | "branch" | "address">("state");

  const { data: treeData, isLoading } = useApiQuery<ApiResponse<State[]>>({
    url: "locations/tree",
    queryKey: queryKeys.locations.tree(),
  });

  const states = treeData?.data ?? [];

  const goBack = () => {
    if (step === "way") { setStep("state"); setSelectedState(null); }
    else if (step === "branch") { setStep("way"); setSelectedWay(null); }
    else if (step === "address") { setStep("way"); setDirectAddress(""); }
  };

  const handleSelectState = (s: State) => {
    setSelectedState(s);
    if (s.ways.length === 0) {
      if (s.isDirectDelivery) {
        setStep("address");
      } else {
        selectLocation(s, null, null, "");
      }
    } else if (s.ways.length === 1 && !s.isDirectDelivery) {
      setSelectedWay(s.ways[0]!);
      if (s.ways[0]!.branches.length === 0) {
        selectLocation(s, s.ways[0]!, null, "");
      } else if (s.ways[0]!.branches.length === 1) {
        selectLocation(s, s.ways[0]!, s.ways[0]!.branches[0]!, "");
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
      selectLocation(selectedState!, w, null, "");
    } else if (w.branches.length === 1) {
      selectLocation(selectedState!, w, w.branches[0]!, "");
    } else {
      setStep("branch");
    }
  };

  const handleSelectBranch = (b: Branch) => {
    selectLocation(selectedState!, selectedWay!, b, "");
  };

  const selectLocation = (s: State, w: Way | null, b: Branch | null, addr: string) => {
    const parts = [s.name];
    if (w) parts.push(w.name);
    if (b) parts.push(b.name);
    if (addr) parts.push(addr);
    const loc: SelectedLocation = {
      state: s._id,
      stateName: s.name,
      way: w?._id,
      wayName: w?.name,
      branch: b?._id,
      branchName: b?.name,
      address: parts.join(" - "),
    };
    router.navigate({ pathname: "/(drawer)/(tabs)/cart", params: { loc: JSON.stringify(loc) } });
  };

  const handleDirectAddress = () => {
    if (!directAddress.trim()) return;
    const addr = `${selectedState!.name}: ${directAddress.trim()}`;
    selectLocation(selectedState!, null, null, addr);
  };

  const renderHeader = () => (
    <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
      <TouchableOpacity onPress={() => { if (step === "state") router.back(); else goBack(); }} style={{ padding: 4, marginRight: 12 }}>
        <Ionicons name="arrow-back" size={24} color={plate.text} />
      </TouchableOpacity>
      <Text style={gs.h3}>{t("cart.deliveryLocation")}</Text>
    </View>
  );

  const renderStateList = () => (
    <>
      <Text style={[gs.label, { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }]}>{t("cart.selectState")}</Text>
      <FlatList
        data={states}
        keyExtractor={(item: State) => item._id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        renderItem={({ item }: { item: State }) => (
          <TouchableOpacity
            style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
            onPress={() => handleSelectState(item)}
          >
            <Ionicons name="location-outline" size={20} color={plate.primary} />
            <Text style={[gs.label, { flex: 1 }]}>{item.name}</Text>
            {item.isDirectDelivery && (
              <Text style={[gs.caption, { color: plate.green }]}>{t("cart.direct")}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </>
  );

  const renderWayList = () => {
    if (!selectedState) return null;
    return (
      <>
        <Text style={[gs.label, { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }]}>
          {t("cart.selectWay", { name: selectedState.name })}
        </Text>
        <FlatList
          data={(selectedState.isDirectDelivery ? [{ _id: "__direct__", name: t("cart.directDelivery"), branches: [] } as Way] : []).concat(selectedState.ways)}
          keyExtractor={(item: Way) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item }: { item: Way }) => (
            <TouchableOpacity
              style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10, ...(item._id === "__direct__" ? { borderColor: plate.green, borderWidth: 1 } : {}) }]}
              onPress={() => item._id === "__direct__" ? setStep("address") : handleSelectWay(item)}
            >
              <Ionicons
                name={item._id === "__direct__" ? "location-outline" : "car-outline"}
                size={20}
                color={item._id === "__direct__" ? plate.green : plate.primary}
              />
              <Text style={gs.label}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </>
    );
  };

  const renderBranchList = () => {
    if (!selectedWay) return null;
    return (
      <>
        <Text style={[gs.label, { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }]}>
          {t("cart.selectBranch", { name: selectedWay.name })}
        </Text>
        <FlatList
          data={selectedWay.branches}
          keyExtractor={(item: Branch) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item }: { item: Branch }) => (
            <TouchableOpacity
              style={[gs.cardFlat, { padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}
              onPress={() => handleSelectBranch(item)}
            >
              <Ionicons name="business-outline" size={20} color={plate.primary} />
              <Text style={gs.label}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </>
    );
  };

  const renderAddressInput = () => {
    if (!selectedState) return null;
    return (
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={[gs.label, { marginBottom: 8 }]}>
          {t("cart.enterAddress", { name: selectedState.name })}
        </Text>
        <View style={[gs.inputContainer, { marginTop: 6, alignItems: "stretch", minHeight: 80 }]}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={[gs.text, { fontWeight: "700", lineHeight: 22 }]}>
              {selectedState.name}:{" "}
            </Text>
            <TextInput
              style={[gs.text, { flex: 1, lineHeight: 22, color: plate.text }]}
              value={directAddress}
              onChangeText={setDirectAddress}
              placeholder={t("cart.addressPlaceholder")}
              placeholderTextColor={plate.graySecond}
              multiline
              autoFocus
            />
          </View>
        </View>
        <Text style={[gs.caption, { marginTop: 6, color: plate.textSecond }]}>
          {t("cart.addressHint")}
        </Text>
        <TouchableOpacity
          style={[gs.button, { marginTop: 16, opacity: directAddress.trim() ? 1 : 0.5 }]}
          onPress={handleDirectAddress}
          disabled={!directAddress.trim()}
        >
          <Text style={gs.buttonText}>{t("cart.confirmAddress")}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[gs.safeArea, gs.centered]}>
        <ActivityIndicator size="large" color={plate.primary} />
      </View>
    );
  }

  return (
    <View style={gs.safeArea}>
      {renderHeader()}
      <View style={{ flex: 1 }}>
        {step === "state" && renderStateList()}
        {step === "way" && renderWayList()}
        {step === "branch" && renderBranchList()}
        {step === "address" && renderAddressInput()}
      </View>
    </View>
  );
}
