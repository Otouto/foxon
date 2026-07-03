import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, gradients, radius } from '@/theme';

import type { ConnectorInfo } from './timeline';

const LINE_COLOR = '#DADDE3';
const DOT_BORDER = '#C5CAD3';

/**
 * Timeline connector between session cards, its column centered under the
 * score ring inside the card above. The gap is proportional to the rest days
 * between sessions, echoing the web's ProportionalConnector:
 *   flush   0d      plain line
 *   dots    1–7d    one hollow dot per rest day
 *   cluster 8–14d   compressed dot cluster + day count
 *   break   15+d    faded line + serif "N weeks away" pill
 * Plain Views only — cheap enough for FlatList rows.
 */
export function RestDayConnector({ connector }: { connector: ConnectorInfo }) {
  const { restDays, tier } = connector;

  if (tier === 'flush') {
    return (
      <View style={[styles.container, styles.flush]}>
        <Line />
      </View>
    );
  }

  if (tier === 'dots') {
    return (
      <View style={[styles.container, { height: 18 + restDays * 12 }]}>
        <Line />
        <View style={[styles.fill, styles.dotsColumn]}>
          {Array.from({ length: restDays }, (_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>
      </View>
    );
  }

  if (tier === 'cluster') {
    return (
      <View style={[styles.container, styles.cluster]}>
        <Line />
        <View style={[styles.fill, styles.clusterDots]}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotSmall]} />
          <View style={[styles.dot, styles.dotTiny]} />
        </View>
        <View style={styles.sideNote}>
          <Text style={styles.clusterCaption}>{restDays}d</Text>
        </View>
      </View>
    );
  }

  // break: an extended pause deserves the editorial voice.
  const label =
    restDays < 21 ? `${restDays} days away` : `${Math.round(restDays / 7)} weeks away`;
  return (
    <View style={[styles.container, styles.break]}>
      <Line faded />
      <View style={styles.sideNote}>
        <View style={styles.breakPill}>
          <Text style={styles.breakLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Line({ faded = false }: { faded?: boolean }) {
  return (
    <View style={[styles.fill, styles.lineWrap]} pointerEvents="none">
      <View style={[styles.line, faded && styles.lineFaded]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Width 54 + marginLeft 18 centers the column at x=45, matching the ring
  // center inside the card (18 card padding + 27 ring radius).
  container: {
    width: 54,
    marginLeft: 18,
  },
  flush: {
    height: 14,
  },
  cluster: {
    height: 72,
  },
  break: {
    height: 64,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineWrap: {
    alignItems: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: LINE_COLOR,
  },
  lineFaded: {
    opacity: 0.45,
  },
  dotsColumn: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  clusterDots: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: DOT_BORDER,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotTiny: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  // Annotations sit to the right of the rail line; the rail column is only
  // 54dp wide, so this wrapper escapes it with an explicit width — the space
  // to the right is the empty gutter between cards.
  sideNote: {
    position: 'absolute',
    left: 36,
    top: 0,
    bottom: 0,
    width: 160,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  clusterCaption: {
    fontSize: 10,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  breakPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: gradients.auroraBorder,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  breakLabel: {
    fontFamily: fonts.serif,
    fontSize: 13,
    color: colors.serifAccent,
  },
});
