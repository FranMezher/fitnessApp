import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useAuthStore } from '@/stores/useAuthStore';
import { api, type Group, type GroupFeedMember } from '@/lib/api';

const MEAL_ICONS: Record<string, string> = {
  breakfast: 'sunny-outline',
  lunch:     'sunny',
  snack:     'cafe-outline',
  dinner:    'moon-outline',
};

const TODAY = new Date().toISOString().slice(0, 10);

type ModalMode = 'create' | 'join' | null;

export default function GroupsScreen() {
  const token = useAuthStore((s) => s.token);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [feed, setFeed] = useState<GroupFeedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const { groups: g } = await api.getMyGroups(token);
      setGroups(g);
      if (g.length && !selectedGroup) {
        setSelectedGroup(g[0]);
        loadFeed(g[0].id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed(groupId: string) {
    if (!token) return;
    setFeedLoading(true);
    try {
      const { feed } = await api.getGroupFeed(token, groupId, TODAY);
      setFeed(feed);
    } catch {
      setFeed([]);
    } finally {
      setFeedLoading(false);
    }
  }

  async function handleCreate() {
    if (!token || !newGroupName.trim()) return;
    try {
      const g = await api.createGroup(token, newGroupName.trim());
      setGroups((prev) => [...prev, g]);
      setSelectedGroup(g);
      setFeed([]);
      setModalMode(null);
      setNewGroupName('');
      Alert.alert('Grupo creado', `Código de invitación: ${g.code}\nCompartilo con tus amigos.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleJoin() {
    if (!token || joinCode.length !== 6) return;
    try {
      const { group: g } = await api.joinGroup(token, joinCode.trim());
      setGroups((prev) => (prev.find((x) => x.id === g.id) ? prev : [...prev, g]));
      setSelectedGroup(g);
      loadFeed(g.id);
      setModalMode(null);
      setJoinCode('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleLeave() {
    if (!selectedGroup || !token) return;
    Alert.alert('Salir del grupo', `¿Seguro que querés salir de "${selectedGroup.name}"?`, [
      { text: 'Cancelar' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await api.leaveGroup(token, selectedGroup.id);
          const remaining = groups.filter((g) => g.id !== selectedGroup.id);
          setGroups(remaining);
          setSelectedGroup(remaining[0] ?? null);
          setFeed([]);
          if (remaining[0]) loadFeed(remaining[0].id);
        },
      },
    ]);
  }

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerBrand}>FITCORE</Text>
          <Ionicons name="notifications-outline" size={22} color={colors.neon} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.neon} size="large" />
          </View>
        ) : groups.length === 0 && !modalMode ? (
          // Empty state
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={48} color={colors.neon} />
            </View>
            <Text style={styles.emptyTitle}>Sin grupos aún</Text>
            <Text style={styles.emptySub}>
              Creá un grupo e invitá a tus amigos.{'\n'}Comparen lo que comen cada día.
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalMode('create')} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={colors.bg} />
              <Text style={styles.createBtnText}>Crear grupo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.joinBtn} onPress={() => setModalMode('join')} activeOpacity={0.8}>
              <Text style={styles.joinBtnText}>Unirme con código</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Grupos de Nutrición</Text>
              <View style={styles.pageHeaderActions}>
                <TouchableOpacity style={styles.headerActionBtn} onPress={() => setModalMode('create')}>
                  <Ionicons name="add" size={16} color={colors.neon} />
                  <Text style={styles.headerActionText}>Crear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionBtn} onPress={() => setModalMode('join')}>
                  <Ionicons name="enter-outline" size={16} color={colors.muted} />
                  <Text style={[styles.headerActionText, { color: colors.muted }]}>Unirse</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Group selector */}
            {groups.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabsScroll}>
                <View style={styles.groupTabs}>
                  {groups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.groupTab, selectedGroup?.id === g.id && styles.groupTabActive]}
                      onPress={() => { setSelectedGroup(g); loadFeed(g.id); }}
                    >
                      <Text style={[styles.groupTabText, selectedGroup?.id === g.id && styles.groupTabTextActive]}>
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Selected group info */}
            {selectedGroup && (
              <View style={styles.groupInfoCard}>
                <View style={styles.groupInfoLeft}>
                  <View style={styles.groupIconWrap}>
                    <Ionicons name="people" size={20} color={colors.neon} />
                  </View>
                  <View>
                    <Text style={styles.groupInfoName}>{selectedGroup.name}</Text>
                    <Text style={styles.groupInfoCode}>
                      Código: <Text style={styles.codeText}>{selectedGroup.code}</Text>
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleLeave} style={styles.leaveBtn}>
                  <Text style={styles.leaveBtnText}>Salir</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Feed */}
            <Text style={styles.sectionTitle}>RANKING DE HOY</Text>

            {feedLoading ? (
              <View style={styles.feedLoading}>
                <ActivityIndicator color={colors.neon} />
              </View>
            ) : feed.length === 0 ? (
              <View style={styles.feedEmpty}>
                <Ionicons name="restaurant-outline" size={36} color={colors.dim} />
                <Text style={styles.feedEmptyText}>Nadie ha registrado comidas hoy.</Text>
              </View>
            ) : (
              feed.map((member, idx) => (
                <View key={member.userId} style={[styles.memberCard, idx === 0 && styles.memberCardFirst]}>
                  <View style={[styles.rankBadge, idx === 0 && styles.rankBadgeFirst]}>
                    <Text style={[styles.rankNum, idx === 0 && { color: colors.bg }]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberMacros}>
                      {member.totalCalories} kcal · {member.totalProteinG}g prot
                    </Text>
                    <View style={styles.memberMeals}>
                      {member.entries.slice(0, 3).map((e, i) => (
                        <View key={i} style={styles.mealChip}>
                          <Ionicons
                            name={(MEAL_ICONS[e.mealType] ?? 'restaurant-outline') as any}
                            size={12}
                            color={colors.muted}
                          />
                          <Text style={styles.mealChipText} numberOfLines={1}>{e.foodName}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.memberKcalWrap}>
                    <Text style={[styles.memberKcal, idx === 0 && { color: colors.neon }]}>
                      {member.totalCalories}
                    </Text>
                    <Text style={styles.memberKcalLabel}>kcal</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Bottom sheet modal */}
        {modalMode && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalMode(null)} />
            <View style={styles.modal}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Crear grupo' : 'Unirme con código'}
              </Text>
              <Text style={styles.modalSub}>
                {modalMode === 'create'
                  ? 'Dale un nombre a tu grupo y compartí el código con tus amigos.'
                  : 'Ingresá el código de 6 letras que te compartieron.'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder={modalMode === 'create' ? 'Nombre del grupo' : 'XXXXXX'}
                placeholderTextColor={colors.dim}
                value={modalMode === 'create' ? newGroupName : joinCode}
                onChangeText={modalMode === 'create'
                  ? setNewGroupName
                  : (v) => setJoinCode(v.toUpperCase())}
                autoCapitalize={modalMode === 'join' ? 'characters' : 'words'}
                maxLength={modalMode === 'join' ? 6 : undefined}
                selectionColor={colors.neon}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, (
                  modalMode === 'create' ? !newGroupName.trim() : joinCode.length !== 6
                ) && styles.modalBtnDisabled]}
                onPress={modalMode === 'create' ? handleCreate : handleJoin}
                disabled={modalMode === 'create' ? !newGroupName.trim() : joinCode.length !== 6}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryBtnText}>
                  {modalMode === 'create' ? 'Crear' : 'Unirme'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalMode(null)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(8,8,8,0.85)',
  },
  headerBrand: { ...text.heroMd, color: colors.neon, fontSize: 20, letterSpacing: -0.5 },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...text.headlineLg, color: colors.text },
  emptySub: { ...text.bodyMd, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neon,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  createBtnText: { ...text.bodyLg, color: colors.bg, fontFamily: 'SpaceGrotesk_700Bold' },
  joinBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinBtnText: { ...text.bodyLg, color: colors.text },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pageTitle: { ...text.headlineLg, color: colors.text },
  pageHeaderActions: { flexDirection: 'row', gap: spacing.sm },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerActionText: { ...text.labelSm, color: colors.neon },

  // Group tabs
  groupTabsScroll: { marginBottom: spacing.xs },
  groupTabs: { flexDirection: 'row', gap: spacing.xs, paddingRight: spacing.lg },
  groupTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupTabActive: { backgroundColor: 'rgba(204,255,0,0.1)', borderColor: 'rgba(204,255,0,0.35)' },
  groupTabText: { ...text.labelSm, color: colors.muted },
  groupTabTextActive: { color: colors.neon },

  // Group info card
  groupInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  groupInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfoName: { ...text.headlineMd, color: colors.text },
  groupInfoCode: { ...text.bodyMd, color: colors.muted },
  codeText: { ...text.dataMono, color: colors.neon },
  leaveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  leaveBtnText: { ...text.labelSm, color: colors.orange },

  // Section
  sectionTitle: { ...text.labelCaps, color: colors.muted },

  // Feed
  feedLoading: { padding: spacing.xl, alignItems: 'center' },
  feedEmpty: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  feedEmptyText: { ...text.bodyMd, color: colors.muted, textAlign: 'center' },

  // Member cards
  memberCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  memberCardFirst: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderColor: 'rgba(204,255,0,0.25)',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rankBadgeFirst: { backgroundColor: colors.neon },
  rankNum: { ...text.dataMono, color: colors.muted, fontSize: 14 },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { ...text.headlineMd, color: colors.text, fontSize: 15 },
  memberMacros: { ...text.bodyMd, color: colors.muted },
  memberMeals: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  mealChipText: { ...text.labelSm, color: colors.muted, fontSize: 9 },
  memberKcalWrap: { alignItems: 'flex-end' },
  memberKcal: { ...text.dataMono, color: colors.text, fontSize: 20 },
  memberKcalLabel: { ...text.labelSm, color: colors.muted, fontSize: 9 },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.dim,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: { ...text.headlineLg, color: colors.text },
  modalSub: { ...text.bodyMd, color: colors.muted, marginTop: -spacing.xs },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  modalPrimaryBtn: {
    backgroundColor: colors.neon,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnDisabled: { opacity: 0.4 },
  modalPrimaryBtnText: { ...text.bodyLg, color: colors.bg, fontFamily: 'SpaceGrotesk_700Bold' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  modalCancelText: { ...text.bodyMd, color: colors.muted },
});
