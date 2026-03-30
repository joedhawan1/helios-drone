import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';

const faqs = [
  {
    q: 'How do I connect to my drone?',
    a: 'Make sure your drone\'s companion computer (Raspberry Pi) is running the drone-server software and your phone is connected to the drone\'s WiFi hotspot (SSID: HELIOS-DRONE). Enter the drone\'s IP address (default: 192.168.4.1), port (8080), and access code (if set) in the Settings tab, then tap Connect.',
  },
  {
    q: 'What does "illumination" mean?',
    a: 'The drone activates its high-power LED spotlight aimed at the GPS coordinates you specify. This can illuminate outdoor areas, construction sites, search zones, event venues, or agricultural fields on demand.',
  },
  {
    q: 'How accurate is the targeting?',
    a: 'Accuracy depends on your GPS signal quality and the drone\'s flight precision. Under ideal conditions, targeting is within 2–5 meters. Your device\'s GPS accuracy is shown on the camera screen.',
  },
  {
    q: 'Can I use the app without a real drone?',
    a: 'Yes. Set the Host field to "demo" in Settings to use simulation mode. All commands are processed locally and no drone is contacted.',
  },
  {
    q: 'How long does illumination last?',
    a: 'Duration depends on the drone\'s battery and your mission parameters. The drone will illuminate until the battery requires it to return to home, or until you send a disconnect command.',
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
      <Text style={styles.screenSubtitle}>How Drone Illumination works</Text>

      {/* Section 1 */}
      <DocSection title="CONNECTING TO YOUR DRONE">
        <Text style={styles.body}>
          Helios connects directly to a companion computer running on your drone over WiFi.{'\n\n'}
          {'  '}1. Power on the drone and companion computer{'\n'}
          {'  '}2. Connect your phone to the <Text style={styles.highlight}>HELIOS-DRONE</Text> WiFi network{'\n'}
          {'  '}3. Enter <Text style={styles.highlight}>192.168.4.1</Text> as the host in the <Text style={styles.highlight}>Settings</Text> tab{'\n'}
          {'  '}4. Tap <Text style={styles.highlight}>Connect to Drone</Text>
        </Text>
      </DocSection>

      {/* Section 2 */}
      <DocSection title="HOW TO ILLUMINATE A LOCATION">
        <Text style={styles.body}>
          Once connected to your drone:
          {'\n\n'}
          {'  '}1. Switch to the <Text style={styles.highlight}>Camera</Text> tab{'\n'}
          {'  '}2. Point your camera at the target location{'\n'}
          {'  '}3. Align the target within the blue reticle{'\n'}
          {'  '}4. Tap the capture button{'\n\n'}
          The app reads your device GPS coordinates and transmits an illumination command to the drone. A white flash confirms the command was sent.
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
          <Text style={styles.highlight}>Drone</Text>
          {'  →  '}
          <Text style={styles.highlight}>Illumination</Text>
        </Text>
        <Text style={[styles.body, { marginTop: Layout.spacing.md }]}>
          Commands are transmitted via WebSocket (real-time) or HTTP (polling). The drone acknowledges receipt and reports when illumination begins. Status is shown live on the camera HUD.
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
