import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { ExerciseRunner } from '../../src/components/exercises/ExerciseRunner';
import { DialogueStep, GrammarStep, VocabStep } from '../../src/components/lesson/LessonSteps';
import { getUnit, units } from '../../src/data';
import { useEntitlement } from '../../src/store/entitlement';
import { useProgress } from '../../src/store/progress';
import { font, spacing, useTheme } from '../../src/theme';

const STEPS = ['Words', 'Grammar', 'Dialogue', 'Practice'];

export default function UnitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const n = Number(id);
  const { colors } = useTheme();
  const router = useRouter();
  const { canAccessUnit } = useEntitlement();
  const { recordActivity, completeUnit } = useProgress();
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ correct: number; total: number; pct: number } | null>(null);

  const meta = units.find((u) => u.id === n);
  const unit = getUnit(n);

  if (!meta) return <Text style={{ color: colors.text, padding: spacing.md }}>Unit not found.</Text>;
  if (!canAccessUnit(n)) return <Redirect href="/paywall" />;
  if (!unit) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 48 }}>{meta.emoji}</Text>
        <Text style={[s.h, { color: colors.text }]}>{meta.titleDe}</Text>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>This unit's lessons are on the way.</Text>
      </View>
    );
  }

  const finish = (correct: number, total: number) => {
    const pct = Math.round((correct / total) * 100);
    setResult({ correct, total, pct });
    if (pct >= unit.testPassPercent) {
      completeUnit(n, pct);
      recordActivity(correct * 10);
    }
  };

  const bar = (
    <View style={s.bar}>
      {STEPS.map((_, i) => (
        <View key={i} style={[s.seg, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
      ))}
    </View>
  );

  if (result) {
    const passed = result.pct >= unit.testPassPercent;
    return (
      <View style={s.center}>
        <Stack.Screen options={{ title: `Unit ${n}` }} />
        <Text style={[s.h, { color: colors.text }]}>{passed ? 'Unit complete' : 'Not yet'}</Text>
        <Text style={{ color: colors.text, fontSize: font.h2 }}>{result.correct} of {result.total} correct ({result.pct}%)</Text>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>
          {passed ? `You earned ${result.correct * 10} XP.` : `You need ${unit.testPassPercent}% to pass. Review the words and try again.`}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md }}>
          {passed ? (
            <Button label="Back to units" onPress={() => router.back()} />
          ) : (
            <>
              <Button label="Try again" onPress={() => { setResult(null); setRound(round + 1); }} />
              <Button label="Review the words" variant="ghost" onPress={() => { setResult(null); setStep(0); }} />
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `Unit ${n}: ${STEPS[step]}` }} />
      {bar}
      {step === 3 ? (
        <ExerciseRunner key={round} exercises={unit.exercises} onFinish={finish} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            {step === 0 && <VocabStep words={unit.vocabulary} />}
            {step === 1 && <GrammarStep grammar={unit.grammar} />}
            {step === 2 && <DialogueStep lines={unit.dialogue} />}
          </ScrollView>
          <View style={{ padding: spacing.md }}>
            <Button label={step === 2 ? 'Start practice' : 'Next'} onPress={() => setStep(step + 1)} />
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  h: { fontSize: font.h1, fontFamily: font.serif, fontWeight: '700', textAlign: 'center' },
});
