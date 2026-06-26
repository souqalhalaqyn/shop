import { getApiClient } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import FormField from "@/components/FormField";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ProductForm {
  nameEn: string; nameAr: string; price: string; stock: string;
  shortDescriptionEn: string; shortDescriptionAr: string;
  longDescriptionEn: string; longDescriptionAr: string;
  images: string[]; tagsEn: string; tagsAr: string;
}

const emptyProduct = (): ProductForm => ({
  nameEn: "", nameAr: "", price: "", stock: "0",
  shortDescriptionEn: "", shortDescriptionAr: "",
  longDescriptionEn: "", longDescriptionAr: "",
  images: [], tagsEn: "", tagsAr: "",
});

export default function AdCreateScreen() {
  const { plate, gs } = useGlobalStyles();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [shortDescriptionEn, setShortDescriptionEn] = useState("");
  const [shortDescriptionAr, setShortDescriptionAr] = useState("");
  const [longDescriptionEn, setLongDescriptionEn] = useState("");
  const [longDescriptionAr, setLongDescriptionAr] = useState("");

  const [products, setProducts] = useState<ProductForm[]>([emptyProduct()]);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(0);

  const handleAddImage = useCallback(async (productIndex: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("common.permissionRequired")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const localUri = result.assets[0].uri;
      const filename = localUri.split("/").pop() || "image.jpg";
      const formData = new FormData();
      formData.append("images", { uri: localUri, name: filename, type: "image/jpeg" } as any);
      const client = getApiClient();
      const response = await client.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const filenames: string[] = response.data?.data ?? [];
      setProducts((prev) => {
        const next = [...prev];
        next[productIndex] = { ...next[productIndex], images: [...next[productIndex].images, ...filenames] };
        return next;
      });
    } catch (err) { Alert.alert(t("common.error"), getErrorMessage(err)); }
  }, [t]);

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
    if (!nameEn.trim() || !nameAr.trim()) {
      Alert.alert("", t("ads.validationContainerRequired"));
      return;
    }
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.nameEn.trim() || !p.price || isNaN(Number(p.price)) || Number(p.price) <= 0) {
        Alert.alert("", t("ads.validationProductRequired", { index: i + 1 }));
        return;
      }
    }

    setSaving(true);
    try {
      const client = getApiClient();
      await client.post("ads", {
        container: {
          nameEn: nameEn.trim(), nameAr: nameAr.trim(),
          shortDescriptionEn: shortDescriptionEn.trim(), shortDescriptionAr: shortDescriptionAr.trim(),
          longDescriptionEn: longDescriptionEn.trim(), longDescriptionAr: longDescriptionAr.trim(),
        },
        products: products.map((p) => ({
          nameEn: p.nameEn.trim(), nameAr: p.nameAr.trim(),
          price: Number(p.price), stock: Number(p.stock) || 0,
          images: p.images,
          shortDescriptionEn: p.shortDescriptionEn.trim(), shortDescriptionAr: p.shortDescriptionAr.trim(),
          longDescriptionEn: p.longDescriptionEn.trim(), longDescriptionAr: p.longDescriptionAr.trim(),
          tagsEn: p.tagsEn.split(",").map((x) => x.trim()).filter(Boolean),
          tagsAr: p.tagsAr.split(",").map((x) => x.trim()).filter(Boolean),
        })),
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
        <FormField label={t("containerForm.nameEn")} value={nameEn} onChangeText={setNameEn} placeholder={t("containerForm.nameEnPlaceholder")} required />
        <FormField label={t("containerForm.nameAr")} value={nameAr} onChangeText={setNameAr} placeholder={t("containerForm.nameArPlaceholder")} required />
        <FormField label={t("containerForm.shortDescEn")} value={shortDescriptionEn} onChangeText={setShortDescriptionEn} placeholder={t("containerForm.shortDescEnPlaceholder")} />
        <FormField label={t("containerForm.shortDescAr")} value={shortDescriptionAr} onChangeText={setShortDescriptionAr} placeholder={t("containerForm.shortDescArPlaceholder")} />
        <FormField label={t("containerForm.longDescEn")} value={longDescriptionEn} onChangeText={setLongDescriptionEn} placeholder={t("containerForm.longDescEnPlaceholder")} multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }} />
        <FormField label={t("containerForm.longDescAr")} value={longDescriptionAr} onChangeText={setLongDescriptionAr} placeholder={t("containerForm.longDescArPlaceholder")} multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }} />

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
                {p.nameEn || `${t("ads.productLabel")} ${i + 1}`}
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
                <FormField label={t("productForm.nameEn")} value={p.nameEn} onChangeText={(v) => updateProduct(i, "nameEn", v)} placeholder={t("productForm.nameEnPlaceholder")} required />
                <FormField label={t("productForm.nameAr")} value={p.nameAr} onChangeText={(v) => updateProduct(i, "nameAr", v)} placeholder={t("productForm.nameArPlaceholder")} required />
                <FormField label={t("productForm.shortDescEn")} value={p.shortDescriptionEn} onChangeText={(v) => updateProduct(i, "shortDescriptionEn", v)} placeholder={t("productForm.shortDescEnPlaceholder")} />
                <FormField label={t("productForm.shortDescAr")} value={p.shortDescriptionAr} onChangeText={(v) => updateProduct(i, "shortDescriptionAr", v)} placeholder={t("productForm.shortDescArPlaceholder")} />
                <FormField label={t("productForm.longDescEn")} value={p.longDescriptionEn} onChangeText={(v) => updateProduct(i, "longDescriptionEn", v)} placeholder={t("productForm.longDescEnPlaceholder")} multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }} />
                <FormField label={t("productForm.longDescAr")} value={p.longDescriptionAr} onChangeText={(v) => updateProduct(i, "longDescriptionAr", v)} placeholder={t("productForm.longDescArPlaceholder")} multiline numberOfLines={3} style={{ minHeight: 60, textAlignVertical: "top", paddingTop: 12 }} />
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
                <FormField label={t("productForm.tagsEn")} value={p.tagsEn} onChangeText={(v) => updateProduct(i, "tagsEn", v)} placeholder={t("productForm.tagsEnPlaceholder")} />
                <FormField label={t("productForm.tagsAr")} value={p.tagsAr} onChangeText={(v) => updateProduct(i, "tagsAr", v)} placeholder={t("productForm.tagsArPlaceholder")} />
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
    </KeyboardAvoidingView>
  );
}
