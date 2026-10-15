import 'react-native-svg';

declare module '*.jpg' {
  const source: number;
  export default source;
}

declare module '*.webp' {
  const source: number;
  export default source;
}

declare module 'react-native-svg' {
  export interface SvgProps {
    className?: string;
  }
}
