import { RFValue } from "react-native-responsive-fontsize";

export const fontScale = (size: number) => RFValue(size);

export const FontSize = {
  small: RFValue(12),
  body: RFValue(16),
  title: RFValue(18),
  heading: RFValue(23),
  ten: RFValue(10),
  eight: RFValue(8),
  fourten: RFValue(14)
};
