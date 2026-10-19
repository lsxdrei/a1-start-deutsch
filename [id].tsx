import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { ItemsRunner } from '../../src/components/exam/ItemsRunner';
import { SchreibenPractice } from '../../src/components/exam/SchreibenPractice';
import { SprechenPractice } from '../../src/components/exam/SprechenPractice';
import { hoeren, lesen } from '../../src/data/exam/mock1';
import { EXAM_MODULES } from '../../src/data/examStructure';
import { useProgress } from '../../src/store/progress';
import { saveScore } from '../../src/store/results';
import { useTheme } from '../../src/theme';
import type { ExamModuleId } from '../../src/types';

export default function ModuleScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { recordActivity } = useProgress();
  const m = EXAM_MODULES.find((x) => x.id === id);
  const kind = mode === 'exam' ? 'exam' : 'practice';
  if (!m) return <Text style={{ color: colors.text, padding: 16 }}>Module not found.</Text>;

  const finish = (score: number) => {
    if (kind === 'exam') saveScore(m.id as ExamModuleId, score);
    recordActivity(5 + Math.round(score / 10));
  };
  const close = () => router.back();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `${m.nameDe} (${kind === 'exam' ? 'mock exam' : 'practice'})` }} />
      {m.id === 'lesen' && <ItemsRunner parts={lesen} mode={kind} minutes={m.minutes} onFinish={finish} onClose={close} />}
      {m.id === 'hoeren' && <ItemsRunner parts={hoeren} mode={kind} minutes={m.minutes} onFinish={finish} onClose={close} />}
      {m.id === 'schreiben' && <SchreibenPractice mode={kind} onFinish={finish} onClose={close} />}
      {m.id === 'sprechen' && <SprechenPractice onFinish={finish} onClose={close} />}
    </View>
  );
}
