import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconProps, IconWeight } from 'phosphor-react-native';

// Direct submodule imports avoid loading all 1,500+ icons in Metro
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretLeft } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckCircle } from 'phosphor-react-native/src/icons/CheckCircle';
import { CloudSlash } from 'phosphor-react-native/src/icons/CloudSlash';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PaperPlaneRight } from 'phosphor-react-native/src/icons/PaperPlaneRight';
import { QrCode } from 'phosphor-react-native/src/icons/QrCode';
import { Scissors } from 'phosphor-react-native/src/icons/Scissors';
import { Tree } from 'phosphor-react-native/src/icons/Tree';
import { User } from 'phosphor-react-native/src/icons/User';
import { WarningCircle } from 'phosphor-react-native/src/icons/WarningCircle';
import { X } from 'phosphor-react-native/src/icons/X';
import { XCircle } from 'phosphor-react-native/src/icons/XCircle';
import { colors } from '../theme/tokens';

export type AppSemanticIconName =
  | 'tree'
  | 'staff'
  | 'taskType'
  | 'calendar'
  | 'deadline'
  | 'check'
  | 'alert'
  | 'chevronRight'
  | 'chevronLeft'
  | 'close'
  | 'closeCircle'
  | 'search'
  | 'send'
  | 'offline'
  | 'back'
  | 'qr';

export type AppIconSize = 'compact' | 'default' | 'large' | number;

const ICON_SIZE_MAP: Record<'compact' | 'default' | 'large', number> = {
  compact: 18,
  default: 20,
  large: 24,
};

export type AppIconProps = {
  name: AppSemanticIconName;
  size?: AppIconSize;
  color?: string;
  weight?: IconWeight;
  style?: StyleProp<ViewStyle>;
};

const ICON_COMPONENT_MAP: Record<AppSemanticIconName, React.ComponentType<IconProps>> = {
  tree: Tree,
  staff: User,
  taskType: Scissors,
  calendar: CalendarBlank,
  deadline: CalendarBlank,
  check: CheckCircle,
  alert: WarningCircle,
  chevronRight: CaretRight,
  chevronLeft: CaretLeft,
  close: X,
  closeCircle: XCircle,
  search: MagnifyingGlass,
  send: PaperPlaneRight,
  offline: CloudSlash,
  back: ArrowLeft,
  qr: QrCode,
};

/**
 * 🌿 AppIcon: Centralized Semantic Icon Component for NOVYX GreenOps.
 * Powered by Phosphor Icons with tree-shaken direct submodule imports.
 */
export function AppIcon({
  name,
  size = 'default',
  color = colors.brandForest,
  weight = 'regular',
  style,
}: AppIconProps) {
  const Component = ICON_COMPONENT_MAP[name];
  const pixelSize = typeof size === 'number' ? size : ICON_SIZE_MAP[size];

  if (!Component) {
    return null;
  }

  return <Component size={pixelSize} color={color} weight={weight} style={style} />;
}
