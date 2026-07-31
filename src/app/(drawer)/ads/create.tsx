import { getApiClient } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import { uploadFiles } from "@/utils/uploadFile";
import { useAuth } from "@/context/AuthContext";
import FormField from "@/components/FormField";
import UploadProgressModal from "@/components/UploadProgressModal";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ProductForm {
  nameAr: string; price: string; stock: string;
  descriptionAr: string;
  images: string[];
}

const emptyProduct = (): ProductForm => ({
  nameAr: "", price: "", stock: "0",
  descriptionAr: "",
  images: [],
});

export default function AdCreateScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [adPrice, setAdPrice] = useState(0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getApiClient().get("settings/exchange-rate").then((res) => {
      setAdPrice(res.data?.data?.adPrice ?? 0);
    }).catch(() => {});
  }, []);

  const [nameAr, setNameAr] = useState("");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");

  const [products, setProducts] = useState<ProductForm[]>([emptyProduct()]);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const pendingFormDataRef = useRef<FormData | null>(null);

  const runUpload = useCallback(async (formData: FormData): Promise<string[] | null> => {
    setUploadProgress(0);
    setUploadError(null);
    setUploading(true);
    pendingFormDataRef.current = formData;
    try {
      const { filenames, abort } = await uploadFiles(formData, setUploadProgress);
      abortRef.current = abort;
      return filenames;
    } catch (err: any) {
      setUploadError(err?.message ?? t("common.uploadError"));
      return null;
    }
  }, [t]);

  const retryUpload = useCallback(() => {
    if (pendingFormDataRef.current) {
      const formData = pendingFormDataRef.current;
      runUpload(formData).then((filenames) => {
        if (filenames) {
          setUploading(false);
          setUploadProgress(0);
          abortRef.current = null;
          pendingFormDataRef.current = null;
        }
      });
    }
  }, [runUpload]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.();
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    abortRef.current = null;
    pendingFormDataRef.current = null;
  }, []);

  useEffect(() => {
    return () => abortRef.current?.();
  }, []);

  const handleAddImage = useCallback(async (productIndex: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("common.permissionRequired")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const localUri = result.assets[0].uri;
    const filename = localUri.split("/").pop() || "image.jpg";
    const formData = new FormData();
    formData.append("images", { uri: localUri, name: filename, type: "image/jpeg" } as any);
    const filenames = await runUpload(formData);
    if (filenames) {
      setProducts((prev) => {
        const next = [...prev];
        next[productIndex] = { ...next[productIndex], images: [...next[productIndex].images, ...filenames] };
        return next;
      });
      setUploading(false);
      setUploadProgress(0);
      abortRef.current = null;
      pendingFormDataRef.current = null;
    }
  }, [t, runUpload]);

  const updateProduct = (index: number, field: keyof ProductForm, value: any) => {
    setProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addProduct = () => {
    setProducts((prev) => {
      const next = [...prev, emptyProduct()];
      return next;
    });
    setExpandedProduct(products.length);
  };

  const handleSubmit = async () => {
    if (uploading) {
      Alert.alert("", "Please wait, images are still uploading");
      return;
    }
    if (!nameAr.trim()) {
      Alert.alert("", t("ads.validationContainerRequired"));
      return;
    }
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.nameAr.trim() || !p.price || isNaN(Number(p.price)) || Number(p.price) <= 0) {
        Alert.alert("", t("ads.validationProductRequired", { index: i + 1 }));
        return;
      }
    }

    if (adPrice > 0 && !confirming) {
      setConfirming(true);
      Alert.alert(
        t("ads.confirmCostTitle"),
        t("ads.confirmCostBody", { price: adPrice.toLocaleString() }),
        [
          { text: t("common.cancel"), style: "cancel", onPress: () => setConfirming(false) },
          { text: t("common.confirm"), onPress: () => { setConfirming(false); doSubmit(); } },
        ],
      );
      return;
    }

    await doSubmit();
  };

  const doSubmit = async () => {
    setSaving(true);
    try {
      const client = getApiClient();
      await client.post("ads", {
        container: {
          nameAr: nameAr.trim(),
        },
        products: products.map((p) => ({
          nameAr: p.nameAr.trim(),
          price: Number(p.price),
          stock: Number(p.stock) || 0,
          images: p.images,
          descriptionAr: p.descriptionAr.trim(),
        })),
        phone: contactPhone.trim() || (user?.phone ?? ""),
      });
      Alert.alert("", t("ads.created"));
      router.back();
    } catch (err) {
      Alert.alert(t("common.error"), getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12 }]}>{t("ads.createTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={[gs.h2, { marginTop: 16, marginBottom: 16 }]}>{t("ads.containerInfo")}</Text>
        <FormField label={t("containerForm.nameAr")} value={nameAr} onChangeText={setNameAr} placeholder={t("containerForm.nameArPlaceholder")} required />

        <Text style={[gs.inputLabel, { marginTop: 16 }]}>{t("checkout.phone")}</Text>
        <View style={gs.inputContainer}>
          <TextInput
            style={gs.input}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            placeholder={t("ads.phonePlaceholder")}
            placeholderTextColor={plate.textSecond}
          />
        </View>

        <View style={[gs.containerRow, { justifyContent: "space-between", marginTop: 24, marginBottom: 12 }]}>
          <Text style={[gs.h2]}>{t("ads.productsInfo")}</Text>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: plate.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
            onPress={addProduct}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13, marginLeft: 4 }}>{t("ads.addProduct")}</Text>
          </TouchableOpacity>
        </View>

        {products.map((p, i) => (
          <View key={i} style={[gs.card, { padding: 12, marginBottom: 12 }]}>
            <TouchableOpacity style={[gs.containerRow, { justifyContent: "space-between" }]} onPress={() => setExpandedProduct(expandedProduct === i ? null : i)}>
              <Text style={[gs.label, { flex: 1 }]} numberOfLines={1}>
                {p.nameAr || `${t("ads.productLabel")} ${i + 1}`}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Ionicons name={expandedProduct === i ? "chevron-up" : "chevron-down"} size={18} color={plate.textSecond} />
                {products.length > 1 && (
                  <TouchableOpacity onPress={() => {
                    setProducts((prev) => prev.filter((_, idx) => idx !== i));
                    setExpandedProduct((prev) => (prev === i ? null : prev));
                  }}>
                    <Ionicons name="trash-outline" size={18} color={plate.red} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
            {expandedProduct === i && (
              <View style={{ marginTop: 12 }}>
                <FormField label={t("productForm.nameAr")} value={p.nameAr} onChangeText={(v) => updateProduct(i, "nameAr", v)} placeholder={t("productForm.nameArPlaceholder")} required />
                <FormField label={t("productForm.descAr")} value={p.descriptionAr} onChangeText={(v) => updateProduct(i, "descriptionAr", v)} placeholder={t("productForm.descArPlaceholder")} multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }} />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FormField label={t("productForm.price")} value={p.price} onChangeText={(v) => updateProduct(i, "price", v)} placeholder={t("productForm.pricePlaceholder")} keyboardType="decimal-pad" required />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label={t("productForm.stock")} value={p.stock} onChangeText={(v) => updateProduct(i, "stock", v)} placeholder={t("productForm.stockPlaceholder")} keyboardType="number-pad" />
                  </View>
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 8, color: plate.text }}>{t("productForm.images")}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {p.images.map((img, idx) => (
                      <View key={idx} style={{ position: "relative" }}>
                        <Image source={{ uri: buildImageUrl(img) }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => handleAddImage(i)} style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderColor: plate.gray, borderStyle: "dashed", justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name="add" size={24} color={plate.graySecond} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[gs.button, { marginTop: 16, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={gs.buttonText}>{saving ? t("common.loading") : t("ads.submitButton")}</Text>
        </TouchableOpacity>
      </ScrollView>

      <UploadProgressModal
        visible={uploading || !!uploadError}
        progress={uploadProgress}
        error={uploadError}
        onRetry={retryUpload}
        onCancel={cancelUpload}
        onDismiss={() => { setUploadError(null); setUploading(false); setUploadProgress(0); abortRef.current = null; pendingFormDataRef.current = null; }}
      />
    </KeyboardAvoidingView>
  );
}
