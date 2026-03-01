import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';

const faqs = [
  {
    q: 'How do I get satellite access?',
    a: 'Contact your satellite service provider directly to purchase or lease time on their satellite. They will provide you with a host address, port, and access code to enter in the Settings tab.',
  },
  {
    q: 'What does "illumination" mean?',
    a: 'The satellite adjusts its reflective panels to redirect sunlight toward the GPS coordinates you specify. This can illuminate outdoor areas, construction sites, event venues, or agricultural fields during night or overcast conditions.',
  },
  {
    q: 'How accurate is the targeting?',
    a: 'Accuracy depends on your GPS signal quality and the satellite\'s orbital position. Under ideal conditions, targeting precision is within 10–50 meters. Your device\'s GPS accuracy is shown on the camera screen.',
  },
  {
    q: 'Can I use the app without a real satellite?',
    a: 'Yes. Set the Host field to "demo" in Settings to use simulation mode. All commands are processed locally and no real satellite is contacted.',
  },
  {
    q: 'How long does illumination last?',
    a: 'Duration depends on your service plan and satellite orbit. Your provider will specify the maximum illumination window per session.',
  },
];

export default function DocsScreen() {
  const insets = useSafeAreaInsets();
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Layout.spacing.lg },
      ]}
    >
      <Text style={styles.screenTitle}>DOCS</Text>
      <Text style={styles.screenSubtitle}>How Satellite Sunlight works</Text>

      {/* Section 1 */}
      <DocSection title="GETTING SATELLITE ACCESS">
        <Text style={styles.body}>
          Satellite Sunlight requires access to a compatible orbital reflector satellite.
          Contact a participating satellite service provider to{'\n\n'}
          {'  '}1. Purchase or lease illumination time{'\n'}
          {'  '}2. Receive your endpoint credentials (host, port, access code){'\n'}
          {'  '}3. Enter those credentials in the <Text style={styles.highlight}>Settings</Text> tab{'\n'}
          {'  '}4. Tap <Text style={styles.highlight}>Connect to Satellite</Text>
        </Text>
      </DocSection>

      {/* Section 2 */}
      <DocSection title="HOW TO ILLUMINATE A LOCATION">
        <Text style={styles.body}>
          Once connected to your satellite:
          {'\n\n'}
          {'  '}1. Switch to the <Text style={styles.highlight}>Camera</Text> tab{'\n'}
          {'  '}2. Point your camera at the target location{'\n'}
          {'  '}3. Align the target within the blue reticle{'\n'}
          {'  '}4. Tap the capture button{'\n\n'}
          The app reads your device GPS coordinates, bundles them with the capture, and transmits an illumination command to the satellite. A white flash confirms the command was sent.
        </Text>
      </DocSection>

      {/* Section 3 */}
      <DocSection title="COMMAND PIPELINE">
        <Text style={styles.body}>
          <Text style={styles.highlight}>Camera</Text>
          {'  →  '}
          <Text style={styles.highlight}>GPS Fix</Text>
          {'  →  '}
          <Text style={styles.highlight}>Command</Text>
          {'  →  '}
          <Text style={styles.highlight}>Satellite</Text>
          {'  →  '}
          <Text style={styles.highlight}>Illumination</Text>
        </Text>
        <Text style={[styles.body, { marginTop: Layout.spacing.md }]}>
          Commands are transmitted via WebSocket (real-time) or HTTP (polling). The satellite acknowledges receipt and reports when illumination begins. Status is shown live on the camera HUD.
        </Text>
      </DocSection>

      {/* FAQ */}
      <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
      {faqs.map((faq, i) => {
        const isOpen = openFaqs.has(i);
        return (
          <Card key={i} style={styles.faqCard}>
            <Pressable onPress={() => toggleFaq(i)} style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={Colors.text.muted}
                style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
              />
            </Pressable>
            {isOpen && <Text style={[styles.body, styles.faqAnswer]}>{faq.a}</Text>}
          </Card>
        );
      })}

      {/* Technical spec */}
      <DocSection title="WEBSOCKET MESSAGE FORMAT">
        <Text style={styles.mono}>
          {'// Illuminate command\n'}
          {'{\n'}
          {'  "type": "illuminate",\n'}
          {'  "payload": {\n'}
          {'    "commandId": "ABC123-XYZ",\n'}
          {'    "coordinates": {\n'}
          {'      "latitude": 38.8977,\n'}
          {'      "longitude": -77.0366,\n'}
          {'      "altitude": 15.2\n'}
          {'    },\n'}
          {'    "timestamp": 1711580400000\n'}
          {'  }\n'}
          {'}'}
        </Text>
      </DocSection>

      <View style={{ height: Layout.spacing.xl + 16 }} />
    </ScrollView>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  content: {
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  screenTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  screenSubtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginBottom: Layout.spacing.xs,
  },
  section: {
    gap: Layout.spacing.sm,
  },
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  body: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
  highlight: {
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  mono: {
    color: Colors.accent.cyan,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  faqCard: {
    marginBottom: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  faqQuestion: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  faqAnswer: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
