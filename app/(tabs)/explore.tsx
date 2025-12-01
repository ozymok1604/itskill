import { Image } from "expo-image";
import { Platform, StyleSheet, View } from "react-native";
import { VSCodeColors } from "@/src/constants/theme";

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      {/* Empty for now */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VSCodeColors.background,
  },
  headerImage: {
    color: VSCodeColors.textMuted,
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
