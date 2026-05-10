import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { useAuthStore } from '@/stores/useAuthStore';

interface Group { id: string; name: string; code: string; createdBy: string }
interface FeedMember {
  userId: string;
  name: string;
  totalCalories: number;
  totalProteinG: number;
  entries: { mealType: string; foodName: string; calories: number }[];
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function useGroupsApi() {
  const { token } = useAuthStore();
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  return {
    async getMyGroups(): Promise<Group[]> {
      const r = await fetch(`${API_URL}/groups/mine`, { headers: auth });
      const d = await r.json();
      return d.groups ?? [];
    },
    async createGroup(name: string): Promise<Group> {
      const r = await fetch(`${API_URL}/groups`, { method: 'POST', headers: auth, body: JSON.stringify({ name }) });
      return r.json();
    },
    async joinGroup(code: string): Promise<Group> {
      const r = await fetch(`${API_URL}/groups/join`, { method: 'POST', headers: auth, body: JSON.stringify({ code }) });
      if (!r.ok) throw new Error('Código inválido');
      const d = await r.json();
      return d.group;
    },
    async getFeed(groupId: string, date: string): Promise<FeedMember[]> {
      const r = await fetch(`${API_URL}/groups/${groupId}/feed?date=${date}`, { headers: auth });
      const d = await r.json();
      return d.feed ?? [];
    },
    async leaveGroup(groupId: string) {
      await fetch(`${API_URL}/groups/${groupId}/leave`, { method: 'DELETE', headers: auth });
    },
  };
}

const TODAY = new Date().toISOString().slice(0, 10);

export default function GroupsScreen() {
  const api = useGroupsApi();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [feed, setFeed] = useState<FeedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const g = await api.getMyGroups();
      setGroups(g);
      if (g.length && !selectedGroup) {
        setSelectedGroup(g[0]);
        loadFeed(g[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed(groupId: string) {
    setFeedLoading(true);
    try {
      const f = await api.getFeed(groupId, TODAY);
      setFeed(f);
    } finally {
      setFeedLoading(false);
    }
  }

  async function handleCreate() {
    if (!newGroupName.trim()) return;
    try {
      const g = await api.createGroup(newGroupName.trim());
      setGroups((prev) => [...prev, g]);
      setSelectedGroup(g);
      setFeed([]);
      setShowCreate(false);
      setNewGroupName('');
      Alert.alert('Grupo creado', `Código de invitación: ${g.code}\nCompartilo con tus amigos.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleJoin() {
    if (joinCode.length !== 6) return;
    try {
      const g = await api.joinGroup(joinCode.trim());
      setGroups((prev) => (prev.find((x) => x.id === g.id) ? prev : [...prev, g]));
      setSelectedGroup(g);
      loadFeed(g.id);
      setShowJoin(false);
      setJoinCode('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleLeave() {
    if (!selectedGroup) return;
    Alert.alert('Salir del grupo', `¿Seguro que querés salir de "${selectedGroup.name}"?`, [
      { text: 'Cancelar' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await api.leaveGroup(selectedGroup.id);
          const remaining = groups.filter((g) => g.id !== selectedGroup.id);
          setGroups(remaining);
          setSelectedGroup(remaining[0] ?? null);
          setFeed([]);
          if (remaining[0]) loadFeed(remaining[0].id);
        },
      },
    ]);
  }

  const MEAL_EMOJI: Record<string, string> = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Grupos de nutrición</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.neon} /></View>
      ) : groups.length === 0 && !showCreate && !showJoin ? (
        // Empty state
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>Sin grupos</Text>
          <Text style={styles.emptySub}>
            Creá un grupo e invitá a tus amigos.{'\n'}Comparen lo que comen cada día y rankeen.
          </Text>
          <TouchableOpacity style={[glassNeon, styles.emptyBtn]} onPress={() => setShowCreate(true)}>
            <Text style={styles.emptyBtnText}>Crear grupo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[glass, styles.emptyBtn]} onPress={() => setShowJoin(true)}>
            <Text style={styles.emptyBtnTextGhost}>Unirme con código</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Group selector tabs */}
          {groups.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabs}>
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
              <TouchableOpacity style={[styles.groupTab, styles.groupTabAdd]} onPress={() => setShowCreate(true)}>
                <Text style={styles.groupTabAddText}>+ Crear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.groupTab, styles.groupTabAdd]} onPress={() => setShowJoin(true)}>
                <Text style={styles.groupTabAddText}>+ Unirme</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Group info */}
          {selectedGroup && (
            <View style={[glass, styles.groupInfo]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupInfoName}>{selectedGroup.name}</Text>
                <Text style={styles.groupInfoCode}>Código: <Text style={styles.code}>{selectedGroup.code}</Text></Text>
              </View>
              <TouchableOpacity onPress={handleLeave}>
                <Text style={styles.leaveBtn}>Salir</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feed */}
          {feedLoading ? (
            <ActivityIndicator color={colors.neon} style={{ marginTop: 32 }} />
          ) : feed.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.feedEmpty}>Nadie ha registrado comidas hoy.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.rankingTitle}>Ranking de hoy</Text>
              {feed.map((member, idx) => (
                <View key={member.userId} style={[glass, styles.memberCard]}>
                  <Text style={[styles.rank, idx === 0 && styles.rankFirst]}>#{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberMacros}>
                      {member.totalCalories} kcal · {member.totalProteinG}g prot
                    </Text>
                    <View style={styles.memberMeals}>
                      {member.entries.map((e, i) => (
                        <Text key={i} style={styles.memberMeal}>
                          {MEAL_EMOJI[e.mealType] ?? '🍽️'} {e.foodName}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.memberKcal}>{member.totalCalories}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Create group modal */}
      {showCreate && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Crear grupo</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Nombre del grupo"
            placeholderTextColor={colors.dim}
            value={newGroupName}
            onChangeText={setNewGroupName}
            selectionColor={colors.neon}
            autoFocus
          />
          <View style={styles.modalBtns}>
            <Btn onPress={handleCreate}>Crear</Btn>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Join group modal */}
      {showJoin && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Unirme con código</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="XXXXXX"
            placeholderTextColor={colors.dim}
            value={joinCode}
            onChangeText={(v) => setJoinCode(v.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
            selectionColor={colors.neon}
            autoFocus
          />
          <View style={styles.modalBtns}>
            <Btn onPress={handleJoin} disabled={joinCode.length !== 6}>Unirme</Btn>
            <TouchableOpacity onPress={() => setShowJoin(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  back: { fontSize: 22, color: colors.text, width: 32 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  emptySub: { fontSize: 14, color: colors.muted, textAlign: 'center', fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 22 },
  emptyBtn: { alignSelf: 'stretch', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  emptyBtnText: { fontSize: 16, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  emptyBtnTextGhost: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  groupTabs: { marginBottom: 4 },
  groupTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupTabActive: { backgroundColor: 'rgba(204,255,0,0.1)', borderColor: colors.borderAccent },
  groupTabText: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_600SemiBold' },
  groupTabTextActive: { color: colors.neon },
  groupTabAdd: { borderStyle: 'dashed' },
  groupTabAddText: { fontSize: 13, color: colors.dim, fontFamily: 'SpaceGrotesk_600SemiBold' },
  groupInfo: { padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  groupInfoName: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  groupInfoCode: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 2 },
  code: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  leaveBtn: { fontSize: 13, color: colors.orange, fontFamily: 'SpaceGrotesk_600SemiBold' },
  rankingTitle: { fontSize: 14, fontWeight: '700', color: colors.muted, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 1, textTransform: 'uppercase' },
  memberCard: { padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rank: { fontSize: 18, fontWeight: '700', color: colors.muted, fontFamily: 'SpaceGrotesk_700Bold', width: 32 },
  rankFirst: { color: colors.neon },
  memberName: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  memberMacros: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 4 },
  memberMeals: { gap: 2 },
  memberMeal: { fontSize: 12, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
  memberKcal: { fontSize: 20, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  feedEmpty: { fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  modalBtns: { gap: 8 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelText: { fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
});
