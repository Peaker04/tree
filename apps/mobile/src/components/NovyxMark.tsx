import Svg, { Ellipse, Path } from 'react-native-svg';

export function NovyxMark({
  size = 32,
  color = '#0f3b2e',
  accentColor = '#6b8e3d',
  opacity = 1,
}: {
  size?: number;
  color?: string;
  accentColor?: string;
  opacity?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" opacity={opacity} accessibilityLabel="NOVYX">
      <Path d="M12 52V31l7 8v13H12Z" fill={color} />
      <Path d="M18 23c7 5 17 14 28 29H36C29 41 23 34 18 29v-6Z" fill={accentColor} />
      <Path d="M43 52V21l7 6v25h-7Z" fill={accentColor} />
      <Path d="M19 31v-7l5 4v6l-5-3ZM43 27v-7l5 4v6l-5-3Z" fill={color} />
      <Ellipse cx="18" cy="19" rx="3" ry="5" transform="rotate(-24 18 19)" fill={accentColor} />
      <Ellipse cx="25" cy="17" rx="3" ry="5" transform="rotate(28 25 17)" fill={accentColor} />
      <Ellipse cx="14" cy="25" rx="2.5" ry="4" transform="rotate(-54 14 25)" fill={accentColor} />
      <Ellipse cx="48" cy="18" rx="3" ry="5" transform="rotate(24 48 18)" fill={accentColor} />
      <Ellipse cx="55" cy="22" rx="2.5" ry="4" transform="rotate(50 55 22)" fill={accentColor} />
      <Ellipse cx="42" cy="14" rx="2.5" ry="4.5" transform="rotate(-20 42 14)" fill={accentColor} />
      <Ellipse cx="38" cy="29" rx="2.4" ry="3.8" transform="rotate(-46 38 29)" fill={accentColor} />
      <Ellipse cx="28" cy="27" rx="2.1" ry="3.3" transform="rotate(42 28 27)" fill={accentColor} />
    </Svg>
  );
}
