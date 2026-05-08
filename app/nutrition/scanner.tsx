import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';

// Real implementation: use expo-barcode-scanner or expo-camera with barcode scanning
// then call an open food API (Open Food Facts) with the scanned EAN code

export default function ScannerScreen() {
  const { meal } = useLocalSearchParams<{ meal: string }>();

  function handleManualEntry() {
    router.replace({ pathname: '/nutrition/search', params: { meal } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Fake camera viewfinder */}
      <View style={styles.viewfinder}>
        {/* Corner markers */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Scan line animation placeholder */}
        <View style={styles.scanLine} />

        <Text style={styles.cameraPlaceholder}>[ Cámara activa ]</Text>
      </View>

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear código</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.bottom}>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionIcon}>▣</Text>
            <Text style={styles.instructionText}>
              Apunta la cámara al código de barras del producto
            </Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <Btn variant="ghost" onPress={handleManualEntry}>
            Buscar manualmente
          </Btn>

          <Text style={styles.hint}>
            Compatible con EAN-13 · EAN-8 · UPC-A
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.neon,
    borderWidth: 3,
  },
  cornerTL: { top: '35%', left: '15%', borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: '35%', right: '15%', borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: '45%', left: '15%', borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: '45%', right: '15%', borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: `${colors.neon}88`,
  },
  cameraPlaceholder: {
    color: '#333',
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  bottom: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 12,
    padding: 14,
  },
  instructionIcon: {
    fontSize: 24,
    color: colors.neon,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
    letterSpacing: 0.5,
  },
});
