import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const defaults = {
  size: 22,
  color: '#eae7e7',
  strokeWidth: 1.75,
};

function svgProps({ size = defaults.size, color = defaults.color, strokeWidth = defaults.strokeWidth }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...svgProps(props)}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

export function ListChecksIcon(props: IconProps) {
  return (
    <Svg {...svgProps(props)}>
      <Path d="M3 6l1.5 1.5L7.5 4.5" />
      <Path d="M3 12l1.5 1.5L7.5 10.5" />
      <Path d="M3 18l1.5 1.5L7.5 15.5" />
      <Path d="M11 6h10" />
      <Path d="M11 12h10" />
      <Path d="M11 18h10" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...svgProps(props)}>
      <Rect x="3" y="4" width="18" height="18" rx="0" />
      <Path d="M16 2v4" />
      <Path d="M8 2v4" />
      <Path d="M3 10h18" />
    </Svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Svg {...svgProps(props)}>
      <Path d="M20 12v9H4v-9" />
      <Rect x="2" y="7" width="20" height="5" />
      <Path d="M12 22V7" />
      <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </Svg>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <Svg {...svgProps(props)}>
      <Path d="M3 3v18h18" />
      <Rect x="7" y="12" width="3" height="6" />
      <Rect x="12" y="8" width="3" height="10" />
      <Rect x="17" y="5" width="3" height="13" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...svgProps(props)}>
      <Circle cx="12" cy="12" r="8" />
      <Path d="M12 7v5l3 3" />
    </Svg>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <Svg {...svgProps(props)}>
      <Path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z" />
      <Path d="M4 4.5v15" />
    </Svg>
  );
}
