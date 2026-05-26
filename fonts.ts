import {
  FontFamily,
  TYPOGRAPHY_TOKENS,
  getTypographySize,
  typographyStyles,
  useTypography,
} from './typography';
import type { TypographyRole } from './typography';

export { FontFamily, TYPOGRAPHY_TOKENS, typographyStyles, useTypography };
export type { TypographyRole };

export const fontScale = (size: number) => size;

const roleSize = (role: TypographyRole) => getTypographySize(role);

export const TypographySize = {
  display: roleSize('display'),
  title: roleSize('title'),
  body: roleSize('body'),
  subheadline: roleSize('subheadline'),
  micro: roleSize('micro'),
  button: roleSize('button'),
};

export const FontSize = {
  // Regression: 4.5-11 RFValue px-like sizes -> 11pt iOS / 11sp Android, micro, native.
  fourHalf: TypographySize.micro,
  five: TypographySize.micro,
  fiveHalf: TypographySize.micro,
  six: TypographySize.micro,
  sixHalf: TypographySize.micro,
  sixPointEight: TypographySize.micro,
  seven: TypographySize.micro,
  sevenHalf: TypographySize.micro,
  eight: TypographySize.micro,
  eightHalf: TypographySize.micro,
  nine: TypographySize.micro,
  ninePointTwo: TypographySize.micro,
  nineHalf: TypographySize.micro,
  ten: TypographySize.micro,
  tenHalf: TypographySize.micro,
  eleven: TypographySize.micro,
  // Regression: 12-13.5 RFValue px-like sizes -> 13pt iOS / 12sp Android, subheadline, native.
  twelve: TypographySize.subheadline,
  twelveHalf: TypographySize.subheadline,
  thirteen: TypographySize.subheadline,
  thirteenHalf: TypographySize.subheadline,
  small: TypographySize.subheadline,
  // Regression: 14-15 RFValue px-like sizes -> 15pt iOS / 14sp Android, body/button, native.
  fourteen: TypographySize.body,
  fourteenHalf: TypographySize.body,
  fifteen: TypographySize.button,
  body: TypographySize.body,
  fourten: TypographySize.body,
  // Regression: 16-29 RFValue px-like sizes -> 20pt iOS / 20sp Android, title, native.
  sixteen: TypographySize.title,
  seventeen: TypographySize.title,
  eighteen: TypographySize.title,
  nineteen: TypographySize.title,
  twenty: TypographySize.title,
  twentyOne: TypographySize.title,
  twentyTwo: TypographySize.title,
  twentyThree: TypographySize.title,
  twentyFour: TypographySize.title,
  twentyFive: TypographySize.title,
  twentySix: TypographySize.title,
  twentySeven: TypographySize.title,
  twentyEight: TypographySize.title,
  twentyNine: TypographySize.title,
  title: TypographySize.title,
  heading: TypographySize.title,
  // Regression: 30-52 RFValue px-like sizes -> 34pt iOS / 34sp Android, display, native.
  thirty: TypographySize.display,
  thirtyOne: TypographySize.display,
  thirtyTwo: TypographySize.display,
  thirtyFour: TypographySize.display,
  thirtySix: TypographySize.display,
  thirtyEight: TypographySize.display,
  thirtyNine: TypographySize.display,
  forty: TypographySize.display,
  fiftyTwo: TypographySize.display,
};
